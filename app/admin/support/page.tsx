'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send,
  MoreVertical,
  User,
  Building,
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

export default function SupportPage() {
  const { data: session } = useSession()
  const [tickets, setTickets] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTickets()
    const interval = setInterval(fetchTickets, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/tickets')
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setTickets(data.tickets)
          // If a ticket is selected, update its messages if they've changed
          if (selectedTicket) {
            const updated = data.tickets.find((t: any) => t.id === selectedTicket.id)
            if (updated && updated.messages.length !== selectedTicket.messages.length) {
              setSelectedTicket(updated)
            }
          }
        }
      }
    } catch (err) {
      console.error('Fetch tickets error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedTicket || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      })

      if (res.ok) {
        setNewMessage('')
        fetchTickets()
      } else {
        toast.error('Failed to send message')
      }
    } catch (err) {
      toast.error('Error sending message')
    } finally {
      setSending(false)
    }
  }

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        toast.success(`Ticket status updated to ${status}`)
        fetchTickets()
      }
    } catch (err) {
      toast.error('Update status failed')
    }
  }

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.guest?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'IN_PROGRESS': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'RESOLVED': return <CheckCircle2 className="w-4 h-4 text-green-500" />
      default: return <CheckCircle2 className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-[#0d1117] rounded-xl border border-white/[0.06] overflow-hidden shadow-2xl">
      {/* Sidebar List */}
      <div className={cn(
        "w-full md:w-[350px] border-r border-white/[0.06] flex flex-col bg-[#0d1117]",
        selectedTicket && "hidden md:flex"
      )}>
        <div className="p-4 border-b border-white/[0.06]">
          <h1 className="text-lg font-bold text-white mb-4">Support Center</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#161b22] border border-white/[0.1] rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#4A9EFF]/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-[#4A9EFF] border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No tickets found</div>
          ) : (
            filteredTickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={cn(
                  "w-full p-4 flex flex-col items-start gap-1 border-b border-white/[0.03] transition-colors relative group",
                  selectedTicket?.id === ticket.id ? "bg-[#161b22]" : "hover:bg-white/[0.02]"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-[#4A9EFF]">{ticket.type}</span>
                  <span className="text-[10px] text-gray-500">{format(new Date(ticket.createdAt), 'MMM d, p')}</span>
                </div>
                <h3 className="text-sm font-semibold text-white truncate w-full text-left">{ticket.subject}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(ticket.status)}
                  <span className="text-xs text-gray-400 font-medium">{ticket.guest?.name || 'Guest'}</span>
                </div>
                {selectedTicket?.id === ticket.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4A9EFF]" />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat View */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#0d1117]",
        !selectedTicket && "hidden md:flex items-center justify-center p-8"
      )}>
        {!selectedTicket ? (
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-[#161b22] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
              <MessageSquare className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Select a ticket to respond</h2>
            <p className="text-gray-500 text-sm">Choose a guest query from the sidebar to start a real-time conversation and provide assistance.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-[#161b22]/50">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedTicket(null)} className="md:hidden p-2 -ml-2 text-gray-400"><ArrowLeft className="w-5 h-5" /></button>
                <div>
                  <h2 className="text-sm font-bold text-white">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-white/[0.05] text-gray-400 px-1.5 py-0.5 rounded border border-white/[0.05] flex items-center gap-1">
                      <User className="w-2.5 h-2.5" /> {selectedTicket.guest?.name}
                    </span>
                    {selectedTicket.property && (
                      <span className="text-[10px] bg-[#4A9EFF]/10 text-[#4A9EFF] px-1.5 py-0.5 rounded border border-[#4A9EFF]/20 flex items-center gap-1">
                        <Building className="w-2.5 h-2.5" /> {selectedTicket.property.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select 
                  value={selectedTicket.status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  className="bg-[#0d1117] border border-white/[0.1] text-xs text-gray-400 rounded-lg px-3 py-1.5 focus:outline-none"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors"><MoreVertical className="w-4 h-4 text-gray-500" /></button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0d1117]">
              {selectedTicket?.messages?.map((msg: any) => {
                const isGuest = msg.senderRole === 'GUEST'
                return (
                  <div key={msg.id} className={cn(
                    "flex flex-col max-w-[80%]",
                    isGuest ? "items-start" : "items-end ml-auto"
                  )}>
                    <div className={cn(
                      "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                      isGuest 
                        ? "bg-[#161b22] text-gray-200 border border-white/[0.05] rounded-tl-none" 
                        : "bg-[#4A9EFF] text-white rounded-tr-none shadow-lg shadow-[#4A9EFF]/10"
                    )}>
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-gray-600 mt-1 px-1 font-medium">
                      {isGuest ? selectedTicket.guest?.name : 'Zenbourg Support'} • {format(new Date(msg.createdAt), 'p')}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-white/[0.06] bg-[#0d1117]">
              <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your response..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-[#161b22] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4A9EFF]/20 pr-12 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="absolute right-2 p-2 bg-[#4A9EFF] hover:bg-[#3A8EEF] disabled:opacity-50 disabled:bg-gray-700 text-white rounded-lg transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
