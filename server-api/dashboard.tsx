"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Receipt, Bot, RefreshCw, Copy, Check, LogOut, ExternalLink, ImageIcon, Wifi, WifiOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

type DashboardProps = {}

// Sample receipt data
const sampleReceipts = [
  {
    id: 1,
    date: "2025-12-24",
    vendor: "Starbucks",
    total: 12.5,
    currency: "USD",
    notes: "Coffee meeting",
    hasImage: true,
  },
  {
    id: 2,
    date: "2025-12-23",
    vendor: "Amazon",
    total: 89.99,
    currency: "USD",
    notes: "Office supplies",
    hasImage: true,
  },
  {
    id: 3,
    date: "2025-12-22",
    vendor: "Uber",
    total: 24.3,
    currency: "USD",
    notes: "Client meeting transport",
    hasImage: false,
  },
  {
    id: 4,
    date: "2025-12-21",
    vendor: "Whole Foods",
    total: 156.78,
    currency: "USD",
    notes: "Team lunch groceries",
    hasImage: true,
  },
  {
    id: 5,
    date: "2025-12-20",
    vendor: "Delta Airlines",
    total: 342.0,
    currency: "USD",
    notes: "Business trip - NYC",
    hasImage: true,
  },
]

export default function Dashboard() {
  const [isConnected, setIsConnected] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [receipts, setReceipts] = useState(sampleReceipts)

  const { user, logout } = useAuth()

  const webhookUrl = "https://script.google.com/macros/s/AKfycbx...xyz/exec"

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsRefreshing(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(webhookUrl)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const toggleConnection = () => {
    setIsConnected(!isConnected)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // Error handled in auth context
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center shadow-sm">
                <Receipt className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground tracking-tight">Receipt Tracker</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  Telegram Bot
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user?.email && <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Bot Status Card */}
          <Card className="border-border/50 shadow-lg shadow-foreground/5 bg-card overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-card-foreground flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Telegram Bot Status
              </CardTitle>
              <CardDescription>Connection status and controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isConnected ? "bg-success/10" : "bg-destructive/10"
                    }`}
                  >
                    {isConnected ? (
                      <Wifi className="w-6 h-6 text-success" />
                    ) : (
                      <WifiOff className="w-6 h-6 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">{isConnected ? "Connected" : "Offline"}</p>
                    <p className="text-sm text-muted-foreground">
                      {isConnected ? "Bot is active and listening" : "Bot is disconnected"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={isConnected ? "default" : "destructive"}
                  className={`cursor-pointer transition-all ${
                    isConnected
                      ? "bg-success/10 text-success hover:bg-success/20 border-success/20"
                      : "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"
                  }`}
                  onClick={toggleConnection}
                >
                  {isConnected ? "Online" : "Offline"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Webhook URL Card */}
          <Card className="border-border/50 shadow-lg shadow-foreground/5 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium text-card-foreground flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Google Apps Script Webhook
              </CardTitle>
              <CardDescription>Your webhook endpoint URL</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={webhookUrl}
                  className="font-mono text-sm bg-muted/50 border-border text-foreground"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0 border-border hover:bg-muted bg-transparent"
                >
                  {isCopied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Configure this URL in your Google Apps Script project
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Receipt Logs Table */}
        <Card className="border-border/50 shadow-lg shadow-foreground/5 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-medium text-card-foreground">Receipt Logs</CardTitle>
              <CardDescription>{receipts.length} receipts synced from Google Sheets</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-border hover:bg-muted bg-transparent"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground">Date</TableHead>
                    <TableHead className="font-semibold text-foreground">Vendor</TableHead>
                    <TableHead className="font-semibold text-foreground text-right">Total</TableHead>
                    <TableHead className="font-semibold text-foreground">Currency</TableHead>
                    <TableHead className="font-semibold text-foreground">Notes</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">Image</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => (
                    <TableRow key={receipt.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium text-foreground">
                        {new Date(receipt.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cream text-foreground">
                          {receipt.vendor}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-foreground">
                        ${receipt.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          {receipt.currency}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{receipt.notes}</TableCell>
                      <TableCell className="text-center">
                        {receipt.hasImage ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-success/10 text-success">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-muted-foreground">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Stats footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {receipts.length} of {receipts.length} receipts
              </p>
              <p className="text-sm font-medium text-foreground">
                Total: ${receipts.reduce((sum, r) => sum + r.total, 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
