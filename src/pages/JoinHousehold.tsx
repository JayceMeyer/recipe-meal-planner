import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Loader2, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface InviteInfo {
  id: string
  email: string
  status: string
  expires_at: string
  household_name: string
  household_id: string
}

export function JoinHousehold() {
  const { token } = useParams<{ token: string }>()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [creditsTransferred, setCreditsTransferred] = useState<number>(0)

  useEffect(() => {
    if (authLoading) return

    let cancelled = false

    const fetchInvite = async () => {
      if (!token) {
        setError('Invalid invite link')
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('household_invites')
        .select('id, email, status, expires_at, household_id')
        .eq('token', token)
        .single()

      if (cancelled) return

      if (fetchError || !data) {
        setError('Invite not found or has been removed')
        setLoading(false)
        return
      }

      if (data.status === 'accepted') {
        setError('This invite has already been used')
        setLoading(false)
        return
      }

      if (data.status === 'expired' || new Date(data.expires_at) < new Date()) {
        setError('This invite has expired')
        setLoading(false)
        return
      }

      const { data: householdData } = await supabase
        .from('households')
        .select('name')
        .eq('id', data.household_id)
        .single()

      if (cancelled) return

      setInvite({
        ...data,
        household_name: householdData?.name ?? 'Unknown Household',
      })
      setLoading(false)
    }

    fetchInvite()

    return () => { cancelled = true }
  }, [token, authLoading])

  const handleJoin = async () => {
    if (!invite || !user) return

    setJoining(true)
    setError(null)

    const { data: existingMember } = await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', invite.household_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      setError('You are already a member of this household')
      setJoining(false)
      return
    }

    const { error: memberError } = await supabase
      .from('household_members')
      .insert({
        household_id: invite.household_id,
        user_id: user.id,
        role: 'member' as const,
      })

    if (memberError) {
      setError(memberError.message)
      setJoining(false)
      return
    }

    await supabase
      .from('household_invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id)

    const { data: currentMembership } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .neq('household_id', invite.household_id)
      .limit(1)
      .single()

    if (currentMembership) {
      const { data: transferred } = await supabase.rpc(
        'transfer_household_credits',
        {
          p_source_household: currentMembership.household_id,
          p_target_household: invite.household_id,
        }
      )
      if (transferred && transferred > 0) {
        setCreditsTransferred(transferred)
      }
    }

    setSuccess(true)
    setJoining(false)

    setTimeout(() => navigate('/'), 2000)
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Invalid Invite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter>
            <Link to="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Join Household
            </CardTitle>
            <CardDescription>
              You've been invited to join <strong>{invite?.household_name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please sign in or create an account to accept this invite.
            </p>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Link to={`/login?redirect=/join/${token}`}>
              <Button>Sign In</Button>
            </Link>
            <Link to={`/signup?redirect=/join/${token}`}>
              <Button variant="outline">Sign Up</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Welcome!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You've joined <strong>{invite?.household_name}</strong>. Redirecting...
            </p>
            {creditsTransferred > 0 && (
              <p className="text-sm text-muted-foreground">
                {creditsTransferred} credits were transferred to your new household.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Join Household
          </CardTitle>
          <CardDescription>
            You've been invited to join a household
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Household</label>
            <p className="text-sm text-muted-foreground">{invite?.household_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Invited as</label>
            <p className="text-sm text-muted-foreground">{invite?.email}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            By joining, you'll share recipes, grocery lists, and pantry items with this household.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={handleJoin} disabled={joining}>
            {joining ? (
              <>
                <Loader2 className="animate-spin" />
                Joining...
              </>
            ) : (
              'Join Household'
            )}
          </Button>
          <Link to="/">
            <Button variant="outline">Cancel</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
