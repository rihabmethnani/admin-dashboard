// Fichier utilitaire pour la gestion des énumérations

// Énumérations correspondant exactement aux valeurs backend
export const IncidentStatus = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En Cours",
  RESOLVED: "Résolu",
  CANCELLED: "Annulé",
}

export const IncidentPriority = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Élevée",
  CRITICAL: "Critique",
}

export const IncidentType = {
  DAMAGED_PACKAGE: "Colis Endommagé",
  INCORRECT_ADDRESS: "Adresse Incorrecte",
  CUSTOMER_NOT_FOUND: "Client Introuvable",
  LOST_PACKAGE: "Colis Perdu",
  WEATHER_DELAY: "Retard Météorologique",
  TRAFFIC_DELAY: "Retard de Circulation",
  REFUSED_PACKAGE: "Colis Refusé",
  OTHER: "Autre",
}

// Fonctions utilitaires pour la conversion des énumérations
export const getEnumKey = (enumObj, value) => {
  // Si la valeur est déjà une clé (en majuscules), la retourner
  if (Object.keys(enumObj).includes(value)) {
    return value
  }
  // Sinon, chercher la clé correspondant à la valeur française
  return Object.keys(enumObj).find((key) => enumObj[key] === value) || value
}

export const getEnumValue = (enumObj, key) => {
  // Si la clé existe, retourner sa valeur
  if (enumObj[key]) {
    return enumObj[key]
  }
  // Si c'est déjà une valeur, la retourner
  if (Object.values(enumObj).includes(key)) {
    return key
  }
  // Sinon, retourner la première valeur comme fallback
  return Object.values(enumObj)[0]
}

// Fonctions spécifiques pour chaque type d'énumération
export const getStatusKey = (value) => getEnumKey(IncidentStatus, value)
export const getStatusValue = (key) => getEnumValue(IncidentStatus, key)

export const getPriorityKey = (value) => getEnumKey(IncidentPriority, value)
export const getPriorityValue = (key) => getEnumValue(IncidentPriority, key)

export const getIncidentTypeKey = (value) => getEnumKey(IncidentType, value)
export const getIncidentTypeValue = (key) => getEnumValue(IncidentType, key)

// Fonction de validation pour s'assurer que les valeurs sont correctes avant l'envoi au backend
export const validateEnumValue = (enumObj, value) => {
  if (Object.values(enumObj).includes(value)) {
    return value
  }
  // Si la valeur est une clé, convertir en valeur
  if (enumObj[value]) {
    return enumObj[value]
  }
  // Sinon, retourner la première valeur comme fallback
  console.warn(`Valeur d'énumération invalide: ${value}. Utilisation de la valeur par défaut.`)
  return Object.values(enumObj)[0]
}
