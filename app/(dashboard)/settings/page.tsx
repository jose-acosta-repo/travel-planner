'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Camera, Calendar, Key, Shield, CreditCard, Download, Loader2 } from 'lucide-react'

type SettingsTab = 'profile' | 'notifications' | 'security' | 'billing'

interface UserSettings {
  display_name: string | null
  currency: string
  timezone: string
  password_last_changed: string | null
  two_factor_enabled: boolean
  two_factor_method: string | null
  google_calendar_connected: boolean
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [timezone, setTimezone] = useState('GMT-08:00')

  // Password change dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // 2FA Setup dialog
  const [show2FADialog, setShow2FADialog] = useState(false)
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'authenticator'>('sms')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [setting2FA, setSetting2FA] = useState(false)

  // Load user settings from API
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/user/settings')
        if (response.ok) {
          const data = await response.json()
          setSettings(data.settings)
          setDisplayName(data.settings.display_name || session?.user?.name || '')
          setEmail(session?.user?.email || '')
          setCurrency(data.settings.currency || 'USD')
          setTimezone(data.settings.timezone || 'GMT-08:00')
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      loadSettings()
    }
  }, [session])

  const tabs = [
    { id: 'profile' as const, label: 'Profile' },
    { id: 'notifications' as const, label: 'Notifications' },
    { id: 'security' as const, label: 'Security' },
    { id: 'billing' as const, label: 'Plan & Billing' },
  ]

  // Save profile settings
  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: displayName,
          currency,
          timezone,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        toast({
          title: 'Settings saved',
          description: 'Your profile settings have been updated successfully.',
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to save settings. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle password change
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all password fields.',
        variant: 'destructive',
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      })
      return
    }

    setChangingPassword(true)
    try {
      // For now, show a message that this feature requires backend implementation
      toast({
        title: 'Feature Coming Soon',
        description: 'Password change functionality requires additional authentication setup.',
      })
      setShowPasswordDialog(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error changing password:', error)
      toast({
        title: 'Error',
        description: 'Failed to change password. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setChangingPassword(false)
    }
  }

  // Handle 2FA setup
  const handleSetup2FA = async () => {
    if (twoFactorMethod === 'sms' && !phoneNumber) {
      toast({
        title: 'Error',
        description: 'Please enter your phone number.',
        variant: 'destructive',
      })
      return
    }

    setSetting2FA(true)
    try {
      // For now, show a message that this feature requires backend implementation
      toast({
        title: 'Feature Coming Soon',
        description: 'Two-factor authentication setup requires additional backend integration.',
      })
      setShow2FADialog(false)
      setPhoneNumber('')
    } catch (error) {
      console.error('Error setting up 2FA:', error)
      toast({
        title: 'Error',
        description: 'Failed to setup 2FA. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSetting2FA(false)
    }
  }

  // Format relative time for password last changed
  const formatPasswordLastChanged = (timestamp: string | null) => {
    if (!timestamp) return 'Never changed'

    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    if (diffDays < 1) return 'Today'
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-8">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-6xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : activeTab === 'profile' ? (
          <div className="space-y-8">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Profile Photo */}
                <div>
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <Avatar className="h-28 w-28">
                        <AvatarImage src={session?.user?.image || ''} />
                        <AvatarFallback className="bg-blue-500 text-white text-2xl">
                          {session?.user?.name?.[0]?.toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <button className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg">
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Profile Photo
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        JPG, GIF or PNG. Max size of 2MB
                      </p>
                      <div className="flex gap-3">
                        <Button variant="outline">Change Photo</Button>
                        <Button variant="ghost" className="text-red-600 hover:text-red-700">
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-gray-900 dark:text-white font-medium">
                      Display Name
                    </Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-gray-50 dark:bg-gray-900"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-900 dark:text-white font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      readOnly
                      disabled
                      className="bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Email is tied to your account and cannot be changed here.
                    </p>
                  </div>

                  {/* Default Currency */}
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-gray-900 dark:text-white font-medium">
                      Default Currency
                    </Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="bg-gray-50 dark:bg-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                        <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                        <SelectItem value="JPY">JPY (¥) - Japanese Yen</SelectItem>
                        <SelectItem value="CAD">CAD ($) - Canadian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Used for the budget tracker calculations.
                    </p>
                  </div>

                  {/* Time Zone */}
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-gray-900 dark:text-white font-medium">
                      Time Zone
                    </Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="bg-gray-50 dark:bg-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GMT-08:00">(GMT-08:00) Pacific Time</SelectItem>
                        <SelectItem value="GMT-07:00">(GMT-07:00) Mountain Time</SelectItem>
                        <SelectItem value="GMT-06:00">(GMT-06:00) Central Time</SelectItem>
                        <SelectItem value="GMT-05:00">(GMT-05:00) Eastern Time</SelectItem>
                        <SelectItem value="GMT+00:00">(GMT+00:00) London</SelectItem>
                        <SelectItem value="GMT+01:00">(GMT+01:00) Paris</SelectItem>
                        <SelectItem value="GMT+09:00">(GMT+09:00) Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Integration Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Integration Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Google Calendar
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Sync trips and flight itineraries automatically.
                      </p>
                    </div>
                  </div>
                  {settings?.google_calendar_connected ? (
                    <Button variant="outline" className="text-green-600 dark:text-green-400">
                      Connected
                    </Button>
                  ) : (
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Connect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeTab === 'notifications' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="py-12">
              <p className="text-center text-gray-500 dark:text-gray-400">
                Notification settings coming soon...
              </p>
            </CardContent>
          </Card>
        ) : null}

        {activeTab === 'security' ? (
          <div className="space-y-6">
            {/* Password Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Password Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <Key className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Account Password
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Last changed {formatPasswordLastChanged(settings?.password_last_changed || null)}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowPasswordDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Two-Factor Authentication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                      settings?.two_factor_enabled
                        ? 'bg-green-100 dark:bg-green-900'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Shield className={`h-6 w-6 ${
                        settings?.two_factor_enabled
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {settings?.two_factor_enabled ? (
                          settings.two_factor_method === 'sms' ? 'SMS Verification' : 'Authenticator App'
                        ) : (
                          'SMS or Authenticator App'
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {settings?.two_factor_enabled
                          ? '2FA is enabled for your account'
                          : 'Enable 2FA to verify logins via phone.'}
                      </p>
                    </div>
                  </div>
                  {settings?.two_factor_enabled ? (
                    <Button
                      variant="outline"
                      className="text-red-600 dark:text-red-400"
                      onClick={() => setShow2FADialog(true)}
                    >
                      Disable
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShow2FADialog(true)}
                    >
                      Setup
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeTab === 'billing' ? (
          <div className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-start justify-between mb-6 gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Pro Plan
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase">
                        Current Plan
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your plan renews on Oct 12, 2024 for $15/month.
                    </p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" className="text-gray-600 dark:text-gray-400 flex-1 md:flex-none">
                      Cancel Subscription
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white flex-1 md:flex-none">
                      Upgrade Plan
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* AI Itinerary Scans */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        AI Itinerary Scans
                      </h4>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        42 / 50 scans used
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: '84%' }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                      Resets in 12 days.
                    </p>
                  </div>

                  {/* Cloud Storage */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Cloud Storage
                      </h4>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        2.1 GB / 10 GB
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: '21%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Visa ending in 4242
                        </h4>
                        <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium uppercase">
                          Default
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Expiry 12/26
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-blue-600 dark:text-blue-400">
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    Billing History
                  </CardTitle>
                  <Button variant="ghost" className="text-blue-600 dark:text-blue-400">
                    <Download className="h-4 w-4 mr-2" />
                    Download All (CSV)
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Invoice
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">
                          INV-2024-009
                        </td>
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                          Sep 12, 2024
                        </td>
                        <td className="py-4 px-4 text-gray-900 dark:text-white font-semibold">
                          $15.00
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-md bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium">
                            Paid
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <Download className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password *</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {settings?.two_factor_enabled ? 'Disable Two-Factor Authentication' : 'Setup Two-Factor Authentication'}
            </DialogTitle>
            <DialogDescription>
              {settings?.two_factor_enabled
                ? 'Are you sure you want to disable 2FA? This will make your account less secure.'
                : 'Add an extra layer of security to your account.'}
            </DialogDescription>
          </DialogHeader>
          {!settings?.two_factor_enabled && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="method">Authentication Method</Label>
                <Select value={twoFactorMethod} onValueChange={(val: any) => setTwoFactorMethod(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS Verification</SelectItem>
                    <SelectItem value="authenticator">Authenticator App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {twoFactorMethod === 'sms' && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              )}
              {twoFactorMethod === 'authenticator' && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FADialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSetup2FA}
              disabled={setting2FA}
              className={settings?.two_factor_enabled ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}
            >
              {setting2FA ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {settings?.two_factor_enabled ? 'Disabling...' : 'Setting up...'}
                </>
              ) : (
                settings?.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
