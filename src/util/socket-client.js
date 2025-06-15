import { io } from "socket.io-client"

class AdminTrackingClient {
  socket = null
  serverUrl
  isConnected = false
  reconnectAttempts = 0
  maxReconnectAttempts = 5
  reconnectDelay = 2000

  connectionListeners = new Set()
  locationListeners = new Map()
  currentLocationListeners = new Set()
  noLocationListeners = new Set()
  locationErrorListeners = new Set()
  driverStatusListeners = new Set()
  connectionErrorListeners = new Set()

  constructor() {
    this.serverUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3001"
        : "https://your-production-tracking-service.com"
  }

  connect() {
    if (this.socket?.connected) {
      console.log("Socket already connected")
      return
    }

    console.log(`Connecting to tracking service: ${this.serverUrl}/tracking`)

    this.socket = io(`${this.serverUrl}/tracking`, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      forceNew: true,
      query: {
        clientType: "admin",
        timestamp: Date.now(),
      },
    })

    this.setupEventHandlers()
  }

  setupEventHandlers() {
    if (!this.socket) return

    this.socket.on("connect", () => {
      console.log("Connected to tracking service with socket ID:", this.socket.id)
      this.isConnected = true
      this.reconnectAttempts = 0
      this.notifyConnectionChange(true)
    })

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from tracking service:", reason)
      this.isConnected = false
      this.notifyConnectionChange(false)
    })

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error.message)
      this.reconnectAttempts++
      this.notifyConnectionError(error.message)

      if (this.reconnectAttempts >= 3) {
        console.log("Switching to polling transport after multiple failures")
        if (this.socket.io) {
          this.socket.io.opts.transports = ["polling", "websocket"]
        }
      }
    })

    this.socket.on("connection:confirmed", (data) => {
      console.log("Connection confirmed:", data)
    })

    this.socket.on("admin:identified", (data) => {
      console.log("Admin identified:", data)
    })

    this.socket.on("tracking:started", (data) => {
      console.log("Tracking started:", data)
    })

    this.socket.on("tracking:stopped", (data) => {
      console.log("Tracking stopped:", data)
    })

    this.socket.on("driver:location_update", (location) => {
      console.log("Driver location update received:", location)
      this.notifyLocationUpdate(location.driverId, location)
    })

    this.socket.on("driver:current_location", (location) => {
      console.log("Driver current location received:", location)
      this.notifyCurrentLocation(location)
    })

    this.socket.on("driver:no_location", (data) => {
      console.log("No location available:", data)
      this.notifyNoLocation(data)
    })

    this.socket.on("driver:location_error", (data) => {
      console.error("Driver location error:", data)
      this.notifyLocationError(data)
    })

    this.socket.on("driver:connection_status", (data) => {
      console.log("Driver connection status:", data)
      this.notifyDriverStatus(data)
    })

    this.socket.on("driver:location_broadcast", (location) => {
      console.log("Driver location broadcast:", location)
      this.notifyLocationUpdate(location.driverId, location)
    })

    this.socket.on("error", (error) => {
      console.error("Socket error:", error)
      this.notifyConnectionError(error.message || "Unknown socket error")
    })
  }

  identifyAsAdmin(adminId) {
    if (!this.socket?.connected) {
      console.warn("Cannot identify as admin: socket not connected")
      return
    }

    console.log("Identifying as admin:", adminId)
    this.socket.emit("admin:identify", { adminId })
  }

  trackDriver(driverId, courseId) {
    if (!this.socket?.connected) {
      console.warn("Cannot track driver: socket not connected")
      return false
    }

    console.log(`Starting to track driver ${driverId} for course ${courseId}`)
    this.socket.emit("admin:track_driver", { driverId, courseId })
    return true
  }

  untrackDriver(driverId) {
    if (!this.socket?.connected) {
      console.warn("Cannot untrack driver: socket not connected")
      return
    }

    console.log(`Stopping tracking for driver ${driverId}`)
    this.socket.emit("admin:untrack_driver", { driverId })
  }

  requestCurrentLocation(driverId) {
    if (!this.socket?.connected) {
      console.warn("Cannot request current location: socket not connected")
      return
    }

    console.log(`Requesting current location for driver ${driverId}`)
    this.socket.emit("admin:request_location", { driverId })
    this.socket.emit("driver:request_position", { driverId })
  }

  async testConnection() {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not initialized"))
        return
      }

      if (!this.socket.connected) {
        reject(new Error("Socket not connected"))
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error("Connection test timeout"))
      }, 5000)

      this.socket.emit("server:status")
      this.socket.once("server:status_response", (response) => {
        clearTimeout(timeout)
        resolve(response)
      })
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  notifyConnectionChange(connected) {
    this.connectionListeners.forEach((listener) => {
      try {
        listener({ connected })
      } catch (error) {
        console.error("Error in connection listener:", error)
      }
    })
  }

  notifyLocationUpdate(driverId, location) {
    const listeners = this.locationListeners.get(driverId)
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(location)
        } catch (error) {
          console.error("Error in location listener:", error)
        }
      })
    }
  }

  notifyCurrentLocation(location) {
    this.currentLocationListeners.forEach((listener) => {
      try {
        listener(location)
      } catch (error) {
        console.error("Error in current location listener:", error)
      }
    })
  }

  notifyNoLocation(data) {
    this.noLocationListeners.forEach((listener) => {
      try {
        listener(data)
      } catch (error) {
        console.error("Error in no location listener:", error)
      }
    })
  }

  notifyLocationError(data) {
    this.locationErrorListeners.forEach((listener) => {
      try {
        listener(data)
      } catch (error) {
        console.error("Error in location error listener:", error)
      }
    })
  }

  notifyDriverStatus(data) {
    this.driverStatusListeners.forEach((listener) => {
      try {
        listener(data)
      } catch (error) {
        console.error("Error in driver status listener:", error)
      }
    })
  }

  notifyConnectionError(error) {
    this.connectionErrorListeners.forEach((listener) => {
      try {
        listener({ error })
      } catch (err) {
        console.error("Error in connection error listener:", err)
      }
    })
  }

  // Abonnements
  onConnectionChange(listener) {
    this.connectionListeners.add(listener)
    return () => this.connectionListeners.delete(listener)
  }

  onLocationUpdate(driverId, listener) {
    if (!this.locationListeners.has(driverId)) {
      this.locationListeners.set(driverId, new Set())
    }
    this.locationListeners.get(driverId).add(listener)

    return () => {
      const listeners = this.locationListeners.get(driverId)
      if (listeners) {
        listeners.delete(listener)
        if (listeners.size === 0) {
          this.locationListeners.delete(driverId)
        }
      }
    }
  }

  onCurrentLocation(listener) {
    this.currentLocationListeners.add(listener)
    return () => this.currentLocationListeners.delete(listener)
  }

  onNoLocation(listener) {
    this.noLocationListeners.add(listener)
    return () => this.noLocationListeners.delete(listener)
  }

  onLocationError(listener) {
    this.locationErrorListeners.add(listener)
    return () => this.locationErrorListeners.delete(listener)
  }

  onDriverStatus(listener) {
    this.driverStatusListeners.add(listener)
    return () => this.driverStatusListeners.delete(listener)
  }

  onConnectionError(listener) {
    this.connectionErrorListeners.add(listener)
    return () => this.connectionErrorListeners.delete(listener)
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      serverUrl: this.serverUrl,
      transport: this.socket?.io?.engine?.transport?.name,
      reconnectAttempts: this.reconnectAttempts,
    }
  }
}

export const adminTrackingClient = new AdminTrackingClient()
