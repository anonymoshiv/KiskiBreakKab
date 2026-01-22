'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Send, MessageCircle } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'sonner'

interface MessageDialogProps {
  friendName: string
  friendUid: string
  currentUserUid: string
  currentUserName: string
}

export function MessageDialog({ friendName, friendUid, currentUserUid, currentUserName }: MessageDialogProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    setIsSending(true)
    try {
      // Store message in Firestore
      await addDoc(collection(db, 'messages'), {
        from: currentUserUid,
        fromName: currentUserName,
        to: friendUid,
        toName: friendName,
        message: message.trim(),
        timestamp: serverTimestamp(),
        read: false,
        type: 'quick_message'
      })

      toast.success(`Message sent to ${friendName}!`)
      setMessage('')
      setOpen(false)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="h-8 px-3 rounded-full bg-[#F63049] hover:bg-[#d42a3f] text-white font-semibold text-xs shadow-lg shadow-[#F63049]/40 transition-all hover:scale-105"
      >
        <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
        Message
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#F63049]">
              Send Message to {friendName}
            </DialogTitle>
            <DialogDescription>
              Send a quick message about meeting up during the break
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-semibold">
                Your Message
              </Label>
              <Textarea
                id="message"
                placeholder="Hey! Want to grab coffee during this break?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] rounded-xl border-2 resize-none focus:border-[#F63049]"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right">
                {message.length}/500 characters
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setMessage('')
              }}
              disabled={isSending}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendMessage}
              disabled={isSending || !message.trim()}
              className="rounded-xl bg-[#F63049] hover:bg-[#d42a3f] text-white"
            >
              {isSending ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
