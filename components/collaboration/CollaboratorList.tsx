'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trip, TripCollaborator } from '@/types'
import { UserPlus, Crown, Trash2, Mail, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'

interface CollaboratorListProps {
  trip: Trip
  onInvite: () => void
  onRefresh: () => void
}

export function CollaboratorList({ trip, onInvite, onRefresh }: CollaboratorListProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  const isOwner = session?.user?.email === trip.owner?.email

  const handleRemove = async () => {
    if (!removingId) return

    setIsRemoving(true)
    try {
      const response = await fetch(`/api/trips/${trip.id}/collaborators/${removingId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({ title: 'Collaborator removed' })
        onRefresh()
      } else {
        toast({ title: 'Failed to remove collaborator', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Something went wrong', variant: 'destructive' })
    } finally {
      setIsRemoving(false)
      setRemovingId(null)
    }
  }

  const getInitials = (name: string | null | undefined, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    }
    return email[0].toUpperCase()
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Collaborators</CardTitle>
          <Button onClick={onInvite} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Owner */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800">
            <Avatar className="h-12 w-12">
              <AvatarImage src={trip.owner?.avatar_url || ''} />
              <AvatarFallback className="bg-yellow-600 text-white font-semibold text-base">
                {getInitials(trip.owner?.name, trip.owner?.email || '')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  {trip.owner?.name || trip.owner?.email}
                </span>
                <Badge className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700 flex-shrink-0">
                  <Crown className="h-3 w-3" />
                  Owner
                </Badge>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate block">
                {trip.owner?.email}
              </span>
            </div>
          </div>

          {/* Collaborators */}
          {trip.collaborators?.map((collab) => (
            <div
              key={collab.id}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
            >
              <Avatar className="h-12 w-12 flex-shrink-0">
                {collab.user ? (
                  <>
                    <AvatarImage src={collab.user.avatar_url || ''} />
                    <AvatarFallback className="bg-blue-600 text-white font-semibold text-base">
                      {getInitials(collab.user.name, collab.user.email)}
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-gray-500 text-white">
                    <Mail className="h-5 w-5" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-white truncate">
                    {collab.user?.name || collab.invited_email}
                  </span>
                  <Badge variant={collab.role === 'editor' ? 'default' : 'secondary'} className="flex-shrink-0">
                    {collab.role}
                  </Badge>
                  {!collab.accepted && (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600 flex-shrink-0">
                      Pending
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate block">
                  {collab.user?.email || collab.invited_email}
                </span>
              </div>

              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                  onClick={() => setRemovingId(collab.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {(!trip.collaborators || trip.collaborators.length === 0) && (
            <div className="text-center py-8 px-4">
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No collaborators yet. Invite someone to plan together!
              </p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Remove Confirmation */}
      <AlertDialog open={!!removingId} onOpenChange={() => setRemovingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Collaborator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this collaborator? They will no longer have access to
              this trip.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-red-600 hover:bg-red-700"
              disabled={isRemoving}
            >
              {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
