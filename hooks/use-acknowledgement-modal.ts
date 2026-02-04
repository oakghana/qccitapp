"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { CompletionAcknowledgementModal } from "@/components/notifications/completion-acknowledgement-modal"

interface PendingAcknowledgement {
  ticketId: string
  ticketTitle: string
  completedBy: string
  type: "ticket" | "repair"
}

export function useAcknowledgementModal() {
  const { user } = useAuth()
  const [pendingAcknowledgement, setPendingAcknowledgement] = useState<PendingAcknowledgement | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    console.log("[v0] Setting up acknowledgement subscriptions for requester:", user.id)

    // Subscribe to ticket completions for current user as requester
    const ticketSubscription = supabase
      .channel(`ticket_ack:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "service_tickets",
          filter: `submitted_by=eq.${user.id}`,
        },
        (payload) => {
          const ticket = payload.new as any
          const oldTicket = payload.old as any

          if (
            oldTicket?.status !== ticket.status &&
            ticket.status === "completed" &&
            !ticket.acknowledged_by_requester
          ) {
            console.log("[v0] Ticket completed, showing acknowledgement modal")
            setPendingAcknowledgement({
              ticketId: ticket.id,
              ticketTitle: ticket.subject || ticket.title || "Service Request",
              completedBy: ticket.completed_by || "IT Team",
              type: "ticket",
            })
            setIsOpen(true)
          }
        },
      )
      .subscribe()

    // Subscribe to repair completions for current user as requester
    const repairSubscription = supabase
      .channel(`repair_ack:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "repair_requests",
          filter: `submitted_by=eq.${user.id}`,
        },
        (payload) => {
          const repair = payload.new as any
          const oldRepair = payload.old as any

          if (
            oldRepair?.status !== repair.status &&
            repair.status === "completed" &&
            !repair.acknowledged_by_requester
          ) {
            console.log("[v0] Repair completed, showing acknowledgement modal")
            setPendingAcknowledgement({
              ticketId: repair.id,
              ticketTitle: repair.issue_description || "Device Repair",
              completedBy: repair.completed_by || "IT Team",
              type: "repair",
            })
            setIsOpen(true)
          }
        },
      )
      .subscribe()

    return () => {
      console.log("[v0] Cleaning up acknowledgement subscriptions")
      supabase.removeChannel(ticketSubscription)
      supabase.removeChannel(repairSubscription)
    }
  }, [user?.id])

  const modal =
    pendingAcknowledgement && isOpen ? (
      <CompletionAcknowledgementModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false)
          setPendingAcknowledgement(null)
        }}
        ticketId={pendingAcknowledgement.ticketId}
        ticketTitle={pendingAcknowledgement.ticketTitle}
        completedBy={pendingAcknowledgement.completedBy}
        type={pendingAcknowledgement.type}
      />
    ) : null

  return { modal }
}
