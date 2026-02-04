"use client"

import { ServiceDeskDashboard } from "@/components/service-desk/service-desk-dashboard"
import { useCompletionAcknowledgements } from "@/hooks/use-ticket-notifications"
import { useAcknowledgementModal } from "@/hooks/use-acknowledgement-modal"

export default function ServiceDeskPage() {
  useCompletionAcknowledgements()
  const { modal } = useAcknowledgementModal()

  return (
    <>
      <ServiceDeskDashboard />
      {modal}
    </>
  )
}
