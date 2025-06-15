"use client"

import { useState, useEffect } from "react"
import { useQuery, useSubscription, useMutation } from "@apollo/client"
import { gql } from "@apollo/client"

// Requêtes GraphQL
const GET_USER_NOTIFICATIONS = gql`
  query GetUserNotifications($userId: String!) {
    getUserNotifications(userId: $userId) {
      _id
      title
      message
      read
      createdAt
      type
      payload
    }
  }
`

const NOTIFICATION_SUBSCRIPTION = gql`
  subscription NotificationAdded($userId: String!) {
    notificationAdded(userId: $userId) {
      _id
      title
      message
      read
      createdAt
      type
      payload
    }
  }
`

const MARK_AS_READ_MUTATION = gql`
  mutation MarkNotificationAsRead($notificationId: String!) {
    markNotificationAsRead(notificationId: $notificationId) {
      _id
      read
      readAt
    }
  }
`

const MARK_ALL_AS_READ_MUTATION = gql`
  mutation MarkAllNotificationsAsRead($userId: String!) {
    markAllNotificationsAsRead(userId: $userId)
  }
`

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([])

  // Charger les notifications existantes
  const { data, loading, error, refetch } = useQuery(GET_USER_NOTIFICATIONS, {
    variables: { userId },
    skip: !userId,
    onCompleted: (data) => {
      if (data?.getUserNotifications) {
        setNotifications(data.getUserNotifications)
      }
    },
  })

  // S'abonner aux nouvelles notifications
  useSubscription(NOTIFICATION_SUBSCRIPTION, {
    variables: { userId },
    skip: !userId,
    onData: ({ data }) => {
      if (data?.data?.notificationAdded) {
        const newNotification = data.data.notificationAdded
        setNotifications((prev) => [newNotification, ...prev])

        // Optionnel: Notification browser
        if (Notification.permission === "granted") {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: "/favicon.ico",
          })
        }
      }
    },
  })

  // Mutations
  const [markAsReadMutation] = useMutation(MARK_AS_READ_MUTATION)
  const [markAllAsReadMutation] = useMutation(MARK_ALL_AS_READ_MUTATION)

  // Fonctions utilitaires
  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = async (notificationId) => {
    try {
      // Mise à jour optimiste
      setNotifications((prev) => prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)))

      await markAsReadMutation({
        variables: { notificationId },
      })
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error)
      // Rollback en cas d'erreur
      refetch()
    }
  }

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

      await markAllAsReadMutation({
        variables: { userId },
      })
    } catch (error) {
      console.error("Erreur lors du marquage de toutes comme lues:", error)
      refetch()
    }
  }

  // Demander la permission pour les notifications browser
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch,
  }
}
