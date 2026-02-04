"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, CheckCircle2, MessageSquare } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface CompletionAcknowledgementModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  ticketTitle: string
  completedBy: string
  type: "ticket" | "repair"
}

export function CompletionAcknowledgementModal({
  isOpen,
  onClose,
  ticketId,
  ticketTitle,
  completedBy,
  type,
}: CompletionAcknowledgementModalProps) {
  const [isAcknowledging, setIsAcknowledging] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleAcknowledge = async () => {
    setIsAcknowledging(true)
    try {
      const table = type === "ticket" ? "service_tickets" : "repair_requests"
      const { error } = await supabase.from(table).update({ acknowledged_by_requester: true }).eq("id", ticketId)

      if (error) {
        console.error("[v0] Error acknowledging:", error)
        return
      }

      // Save feedback if provided
      if (feedback) {
        await supabase.from("work_feedback").insert({
          ticket_id: ticketId,
          feedback_type: "completion_feedback",
          feedback_text: feedback,
          rating: "positive",
          created_at: new Date().toISOString(),
        })
      }

      setIsSubmitted(true)
      setTimeout(onClose, 2000)
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setIsAcknowledging(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-200 dark:bg-green-800 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white">Work Completed!</h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Please acknowledge and confirm</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            {!isSubmitted ? (
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold text-gray-900 dark:text-white">{ticketTitle}</span>
                    <br />
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 block">Completed by: {completedBy}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Add Feedback (Optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="How was the service? Any comments or suggestions?"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={onClose} className="flex-1" disabled={isAcknowledging}>
                    Later
                  </Button>
                  <Button
                    onClick={handleAcknowledge}
                    disabled={isAcknowledging}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isAcknowledging ? "Confirming..." : "Confirm Complete"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-300" />
                </motion.div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Thank you!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your acknowledgement has been recorded. {feedback ? "Thank you for your feedback!" : ""}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
