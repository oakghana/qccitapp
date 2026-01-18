"use client"

import { useNotifications } from "./notification-context"

type Entity = string

export function useCrudNotifier(entity: Entity) {
  const { addNotification, showToast } = useNotifications()

  const titleFor = (action: string) => `${entity} ${action}`

  const created = (name?: string) => {
    const title = titleFor("created")
    const msg = name ? `${name} was created.` : `New ${entity} created.`
    addNotification({ title, message: msg, type: "success", priority: "medium" , actionUrl: undefined, actionLabel: undefined, userId: undefined })
  }

  const updated = (name?: string) => {
    const title = titleFor("updated")
    const msg = name ? `${name} was updated.` : `${entity} updated.`
    addNotification({ title, message: msg, type: "success", priority: "medium" , actionUrl: undefined, actionLabel: undefined, userId: undefined })
  }

  const deleted = (name?: string) => {
    const title = titleFor("deleted")
    const msg = name ? `${name} was deleted.` : `${entity} removed.`
    addNotification({ title, message: msg, type: "info", priority: "medium" , actionUrl: undefined, actionLabel: undefined, userId: undefined })
  }

  const error = (message?: string) => {
    const title = titleFor("error")
    const msg = message || `Failed to perform action on ${entity}.`
    // show immediate toast for errors
    showToast(title, msg, "error")
    addNotification({ title, message: msg, type: "error", priority: "high" , actionUrl: undefined, actionLabel: undefined, userId: undefined })
  }

  return { created, updated, deleted, error }
}

export default useCrudNotifier
