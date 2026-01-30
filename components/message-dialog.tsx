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
        className="h-8 px-3 rounded-none bg-[#F63049] hover:bg-[#d42a3f] text-white font-black text-xs border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_#fff] uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
      >
        <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
        MSG
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-black p-0 border-2 border-black dark:border-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_#fff]">
          <DialogHeader className="p-4 border-b-2 border-black dark:border-white bg-[#FEF08A] dark:bg-yellow-900">
            <DialogTitle className="text-xl font-black text-black dark:text-white uppercase tracking-wider">
              Message {friendName}
            </DialogTitle>
            <DialogDescription className="text-black/70 dark:text-white/70 font-mono text-xs">
              Make plans for the break. Keep it short.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-6 bg-white dark:bg-zinc-900">
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-bold uppercase tracking-wide">
                Your Message
              </Label>
              <Textarea
                id="message"
                placeholder="Hey! Want to grab coffee during this break?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] rounded-none border-2 border-black dark:border-white resize-none bg-gray-50 dark:bg-black focus:ring-0 focus:ring-offset-0 focus:border-black dark:focus:border-white font-mono text-sm"
                maxLength={500}
              />
              <p className="text-xs font-mono text-gray-500 text-right">
                {message.length}/500 chars
              </p>
            </div>
          </div>
          <DialogFooter className="p-4 bg-white dark:bg-zinc-900 border-t-2 border-black dark:border-white gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setMessage('')
              }}
              disabled={isSending}
              className="rounded-none border-2 border-black dark:border-white font-bold uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendMessage}
              disabled={isSending || !message.trim()}
              className="rounded-none bg-[#F63049] hover:bg-[#d42a3f] text-white font-bold uppercase border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_#fff] transition-all"
            >
              {isSending ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send It
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
