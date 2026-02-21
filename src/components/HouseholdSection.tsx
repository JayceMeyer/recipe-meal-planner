import { useState, type FormEvent } from 'react'
import { Copy, Check, X, UserMinus, Link, Pencil, Users, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useHouseholdInvites } from '@/hooks/useHouseholdInvites'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function HouseholdSection() {
  const { user } = useAuth()
  const { household, members, loading, isOwner, refreshMembers, createHousehold } = useHousehold()
  const { invites, createInvite, cancelInvite } = useHouseholdInvites()

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [justCreated, setJustCreated] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [householdName, setHouseholdName] = useState('')
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  if (!household) {
    if (loading) return null

    const handleCreate = async () => {
      setCreating(true)
      setCreateError(null)
      try {
        await createHousehold()
      } catch {
        setCreateError('Failed to create household. Please try again.')
      } finally {
        setCreating(false)
      }
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Household
          </CardTitle>
          <CardDescription>
            Share your recipes, grocery lists, and pantry with household members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You don't have a household yet. Create one to start sharing with others.
          </p>
          {createError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {createError}
            </div>
          )}
          <Button onClick={handleCreate} disabled={creating}>
            {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Household
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setInviting(true)
    const invite = await createInvite(inviteEmail)
    setInviteEmail('')
    setInviting(false)

    if (invite) {
      const link = `${window.location.origin}/join/${invite.token}`
      navigator.clipboard.writeText(link)
      setCopiedToken(invite.token)
      setJustCreated(true)
      setTimeout(() => {
        setCopiedToken(null)
        setJustCreated(false)
      }, 3000)
    }
  }

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/join/${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const handleUpdateName = async () => {
    if (!householdName.trim()) return

    await supabase
      .from('households')
      .update({ name: householdName.trim() })
      .eq('id', household.id)

    setEditingName(false)
    refreshMembers()
  }

  const handleRemoveMember = async (memberId: string) => {
    setRemovingMemberId(memberId)

    await supabase
      .from('household_members')
      .delete()
      .eq('id', memberId)

    setRemovingMemberId(null)
    refreshMembers()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Household
        </CardTitle>
        <CardDescription>
          Share your recipes, grocery lists, and pantry with household members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium">Household Name</label>
          {editingName ? (
            <div className="flex gap-2 mt-1">
              <Input
                value={householdName}
                onChange={e => setHouseholdName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUpdateName()}
              />
              <Button size="sm" onClick={handleUpdateName}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setEditingName(false)}>Cancel</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">{household.name}</p>
              {isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => { setHouseholdName(household.name); setEditingName(true) }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Members ({members.length})</label>
          <div className="mt-2 space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                    {member.user_id === user?.id ? 'You' : '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {member.user_id === user?.id ? 'You' : member.user_id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                  </div>
                </div>
                {isOwner && member.user_id !== user?.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={removingMemberId === member.id}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Invite Someone</label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create an invite link to share with them
          </p>
          <form onSubmit={handleInvite} className="flex gap-2 mt-2">
            <Input
              type="email"
              placeholder="email@example.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              required
              disabled={inviting}
            />
            <Button type="submit" size="sm" disabled={inviting || !inviteEmail.trim()}>
              <Link className="h-4 w-4 mr-1" />
              Create
            </Button>
          </form>
          {justCreated && (
            <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Invite link copied to clipboard — share it with them!
            </p>
          )}
        </div>

        {invites.length > 0 && (
          <div>
            <label className="text-sm font-medium">Pending Invites</label>
            <div className="mt-2 space-y-2">
              {invites.map(invite => (
                <div key={invite.id} className="flex items-center justify-between p-2 rounded-md border">
                  <div>
                    <p className="text-sm">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 gap-1"
                      onClick={() => handleCopyLink(invite.token)}
                    >
                      {copiedToken === invite.token ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-xs text-green-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span className="text-xs">Copy link</span>
                        </>
                      )}
                    </Button>
                    {isOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => cancelInvite(invite.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
