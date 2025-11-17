'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { lpChartTemplates, lpChartCategories, getTemplatesByCategory, lpDataSourceOptions, lpMetricsByDataSource, lpChartTypeOptions, LPChartTemplate } from '@/lib/lp-chart-templates'
import { lpMetricTemplates, lpMetricCategories, getMetricsByCategory, LPMetricTemplate } from '@/lib/lp-metric-templates'
import { calculateLPMetric } from '@/lib/lp-metric-calculations'
import { ChartConfig, DashboardWidget } from '@/lib/lp-dashboard-storage'
import { addWidget, updateWidget, getDashboardConfig, addSection } from '@/lib/lp-dashboard-storage'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getInvestorStructures, getInvestorByEmail, getCurrentInvestorEmail } from '@/lib/lp-portal-helpers'
import { TrendingUp, DollarSign, Wallet, PieChart as PieChartIcon, BarChart3 } from 'lucide-react'

interface LPChartBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChartAdded?: () => void
  editingWidget?: DashboardWidget | null
}

export function LPChartBuilderDialog({ open, onOpenChange, onChartAdded, editingWidget }: LPChartBuilderDialogProps) {
  const [selectedCategory, setSelectedCategory] = React.useState('all')
  const [selectedTemplate, setSelectedTemplate] = React.useState<LPChartTemplate | null>(null)
  const [selectedMetricCategory, setSelectedMetricCategory] = React.useState('all')
  const [selectedMetric, setSelectedMetric] = React.useState<LPMetricTemplate | null>(null)
  const [metricSize, setMetricSize] = React.useState<'small' | 'medium' | 'large'>('small')
  const [chartSize, setChartSize] = React.useState<'small' | 'medium' | 'large'>('large')
  const [selectedFund, setSelectedFund] = React.useState<string>('all')

  // Custom chart form state
  const [customChart, setCustomChart] = React.useState<ChartConfig>({
    type: 'line',
    dataSource: 'portfolio-value',
    metrics: [],
    title: '',
    description: '',
    fundId: 'all',
  })

  // Metric card form state
  const [metricCard, setMetricCard] = React.useState({
    title: '',
    value: '',
    description: '',
    badge: '',
    trend: 'neutral' as 'up' | 'down' | 'neutral',
  })

  // Load editing widget data when dialog opens
  React.useEffect(() => {
    if (editingWidget && open) {
      if (editingWidget.type === 'chart') {
        const config = editingWidget.config as ChartConfig
        setCustomChart(config)
      } else if (editingWidget.type === 'metric') {
        const config = editingWidget.config as any
        setMetricCard(config)
        if (config.metricId) {
          const metric = lpMetricTemplates.find(m => m.id === config.metricId)
          if (metric) setSelectedMetric(metric)
        }
        if (config.size) {
          setMetricSize(config.size)
        }
        if (config.fundId) {
          setSelectedFund(config.fundId)
        }
      }
    } else if (!open) {
      // Reset form when dialog closes
      setCustomChart({
        type: 'line',
        dataSource: 'portfolio-value',
        metrics: [],
        title: '',
        description: '',
        fundId: 'all',
      })
      setMetricCard({
        title: '',
        value: '',
        description: '',
        badge: '',
        trend: 'neutral',
      })
      setSelectedTemplate(null)
      setSelectedMetric(null)
      setMetricSize('small')
      setSelectedFund('all')
    }
  }, [editingWidget, open])

  const handleTemplateSelect = (template: LPChartTemplate) => {
    setSelectedTemplate(template)
  }

  const handleAddTemplateChart = () => {
    if (!selectedTemplate) return

    // Get fund name for section
    const email = getCurrentInvestorEmail()
    const investor = getInvestorByEmail(email)
    if (!investor) return

    const structures = getInvestorStructures(investor)
    const fund = structures.find(s => s.id === selectedFund)
    const fundName = fund ? fund.name : 'All Funds'

    // Find or create section for this fund
    const config = getDashboardConfig()
    let section = config.widgets.find(w =>
      w.type === 'section' &&
      (w.config as any).fundId === selectedFund
    )

    // If section doesn't exist, create it
    if (!section) {
      section = addSection(fundName, selectedFund)
    }

    // Add widget to the section
    addWidget({
      type: 'chart',
      config: {
        ...selectedTemplate.config,
        fundId: selectedFund,
        size: chartSize,
      },
      isCustom: false,
      sectionId: section.id,
    })

    onOpenChange(false)
    setSelectedTemplate(null)
    setChartSize('large')
    onChartAdded?.()
  }

  const handleAddCustomChart = () => {
    if (!customChart.title || customChart.metrics.length === 0) {
      toast.error('Please provide a title and select at least one metric')
      return
    }

    if (editingWidget) {
      // Update existing widget
      updateWidget(editingWidget.id, {
        config: customChart,
      })
    } else {
      // Add new widget
      addWidget({
        type: 'chart',
        config: customChart,
        isCustom: true,
      })
    }

    onOpenChange(false)
    setCustomChart({
      type: 'line',
      dataSource: 'portfolio-value',
      metrics: [],
      title: '',
      description: '',
    })
    onChartAdded?.()
  }

  const handleAddMetricCard = () => {
    if (!selectedMetric) {
      toast.error('Please select a metric template')
      return
    }

    // Get fund name for section
    const email = getCurrentInvestorEmail()
    const investor = getInvestorByEmail(email)
    if (!investor) return

    const structures = getInvestorStructures(investor)
    const fund = structures.find(s => s.id === selectedFund)
    const fundName = fund ? fund.name : 'All Funds'

    // Find or create section for this fund
    const config = getDashboardConfig()
    let section = config.widgets.find(w =>
      w.type === 'section' &&
      (w.config as any).fundId === selectedFund
    )

    // If section doesn't exist, create it
    if (!section) {
      section = addSection(fundName, selectedFund)
    }

    if (editingWidget) {
      // Update existing metric widget
      updateWidget(editingWidget.id, {
        config: {
          metricId: selectedMetric.id,
          title: selectedMetric.title,
          size: metricSize,
          fundId: selectedFund,
        },
        sectionId: section.id,
      })
    } else {
      // Add new metric widget to the section
      addWidget({
        type: 'metric',
        config: {
          metricId: selectedMetric.id,
          title: selectedMetric.title,
          size: metricSize,
          fundId: selectedFund,
        },
        isCustom: true,
        sectionId: section.id,
      })
    }

    onOpenChange(false)
    setSelectedMetric(null)
    setMetricSize('small')
    setSelectedFund('all')
    onChartAdded?.()
  }

  const handleCustomChartChange = (field: keyof ChartConfig, value: any) => {
    setCustomChart(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'dataSource' && { metrics: [] }), // Reset metrics when data source changes
    }))
  }

  const handleMetricToggle = (metric: string) => {
    setCustomChart(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric)
        ? prev.metrics.filter(m => m !== metric)
        : [...prev.metrics, metric],
    }))
  }

  const filteredTemplates = getTemplatesByCategory(selectedCategory)
  const availableMetrics = lpMetricsByDataSource[customChart.dataSource] || []

  // Get investor funds for dropdown
  const getInvestorFunds = () => {
    const email = getCurrentInvestorEmail()
    const investor = getInvestorByEmail(email)
    if (!investor) return []
    return getInvestorStructures(investor)
  }

  const investorFunds = getInvestorFunds()

  // Generate sample data for preview
  const generatePreviewData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return months.map(month => {
      const data: any = { month }
      customChart.metrics.forEach((metric, index) => {
        data[metric] = Math.floor(Math.random() * 5000) + 1000 + (index * 1000)
      })
      return data
    })
  }

  const previewData = generatePreviewData()
  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

  // Get icon for template
  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'portfolio':
        return PieChartIcon
      case 'capital':
        return Wallet
      case 'performance':
        return TrendingUp
      case 'distributions':
        return DollarSign
      default:
        return BarChart3
    }
  }

  // Get icon for metric
  const getMetricIcon = (category: string) => {
    switch (category) {
      case 'portfolio':
        return PieChartIcon
      case 'capital':
        return Wallet
      case 'performance':
        return TrendingUp
      case 'funds':
        return BarChart3
      default:
        return DollarSign
    }
  }

  // Render chart preview based on type
  const renderChartPreview = () => {
    if (customChart.metrics.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center bg-muted/50 rounded-lg">
          <div className="text-center text-muted-foreground">
            <p className="text-sm font-medium">Select metrics to see preview</p>
            <p className="text-xs mt-1">Choose at least one metric from the left</p>
          </div>
        </div>
      )
    }

    const commonProps = {
      data: previewData,
      margin: { top: 5, right: 5, left: 5, bottom: 5 }
    }

    switch (customChart.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              {customChart.metrics.map((metric, index) => (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              {customChart.metrics.map((metric, index) => (
                <Bar
                  key={metric}
                  dataKey={metric}
                  fill={colors[index % colors.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              {customChart.metrics.map((metric, index) => (
                <Area
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'pie':
      case 'donut':
        // For pie/donut, use the first data point and show metrics as segments
        const pieData = customChart.metrics.map((metric, index) => ({
          name: metric,
          value: previewData[0][metric] || 0
        }))

        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={customChart.type === 'donut' ? 40 : 0}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
                label={(entry) => entry.name}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return (
          <div className="h-48 flex items-center justify-center bg-muted/50 rounded-lg">
            <div className="text-center text-muted-foreground">
              <p className="text-sm font-medium">Chart Preview</p>
              <p className="text-xs mt-1">{customChart.type} chart</p>
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[1400px] sm:max-w-[1400px] md:max-w-[1400px] lg:max-w-[1400px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingWidget ? 'Edit Widget' : 'Add a Graph'}</DialogTitle>
          <DialogDescription>
            {editingWidget ? 'Modify your widget configuration' : 'Choose from preset templates, create a custom chart, or add a metric card'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={editingWidget ? (editingWidget.type === 'metric' ? 'metrics' : 'custom') : 'templates'} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="custom">Custom Chart</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            {/* Category filters */}
            <div className="flex gap-2 flex-wrap">
              {lpChartCategories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.label}
                  <Badge variant="secondary" className="ml-2">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Fund and size selectors */}
            <div className="flex items-center gap-4">
              {/* Fund selector */}
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">Fund:</Label>
                <Select value={selectedFund} onValueChange={setSelectedFund}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Funds</SelectItem>
                    {investorFunds.map(fund => (
                      <SelectItem key={fund.id} value={fund.id}>
                        {fund.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chart Size selector */}
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">Chart Size:</Label>
                <Select value={chartSize} onValueChange={(value: 'small' | 'medium' | 'large') => setChartSize(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Template grid */}
            <div className="grid grid-cols-3 gap-4">
              {filteredTemplates.map(template => {
                const Icon = getTemplateIcon(template.category)
                const isSelected = selectedTemplate?.id === template.id

                return (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="capitalize">
                            {template.config.type}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-sm text-muted-foreground mb-2">
                        {template.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddTemplateChart}
                disabled={!selectedTemplate}
              >
                Add Chart
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            {/* Category filters */}
            <div className="flex gap-2 flex-wrap">
              {lpMetricCategories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedMetricCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetricCategory(category.id)}
                >
                  {category.label}
                  <Badge variant="secondary" className="ml-2">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Fund and size selectors */}
            <div className="flex items-center gap-4">
              {/* Fund selector */}
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">Fund:</Label>
                <Select value={selectedFund} onValueChange={setSelectedFund}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Funds</SelectItem>
                    {investorFunds.map(fund => (
                      <SelectItem key={fund.id} value={fund.id}>
                        {fund.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Size selector */}
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">Card Size:</Label>
                <Select value={metricSize} onValueChange={(value: 'small' | 'medium' | 'large') => setMetricSize(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Metric templates grid */}
            <div className="grid grid-cols-3 gap-4">
              {getMetricsByCategory(selectedMetricCategory).map(metric => {
                const Icon = getMetricIcon(metric.category)
                const isSelected = selectedMetric?.id === metric.id
                const calculatedValue = calculateLPMetric(metric.id, selectedFund)

                return (
                  <Card
                    key={metric.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedMetric(metric)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        {calculatedValue.badge && (
                          <Badge variant={calculatedValue.trend === 'up' ? 'default' : calculatedValue.trend === 'down' ? 'destructive' : 'secondary'}>
                            {calculatedValue.badge}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-sm text-muted-foreground">
                        {metric.title}
                      </CardTitle>
                      <div className="text-2xl font-bold">
                        {calculatedValue.value}
                      </div>
                      <CardDescription className="text-xs">
                        {calculatedValue.description || metric.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddMetricCard}
                disabled={!selectedMetric}
              >
                {editingWidget && editingWidget.type === 'metric' ? 'Update Metric' : 'Add Metric'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Left column: Configuration */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chart-title">Chart Title</Label>
                  <Input
                    id="chart-title"
                    placeholder="e.g., Portfolio Performance"
                    value={customChart.title}
                    onChange={(e) => handleCustomChartChange('title', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chart-description">Description (Optional)</Label>
                  <Input
                    id="chart-description"
                    placeholder="e.g., Track performance over time"
                    value={customChart.description}
                    onChange={(e) => handleCustomChartChange('description', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-fund">Filter by Fund</Label>
                  <Select
                    value={customChart.fundId || 'all'}
                    onValueChange={(value) => handleCustomChartChange('fundId', value)}
                  >
                    <SelectTrigger id="custom-fund">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Funds</SelectItem>
                      {investorFunds.map(fund => (
                        <SelectItem key={fund.id} value={fund.id}>
                          {fund.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chart-type">Chart Type</Label>
                  <Select
                    value={customChart.type}
                    onValueChange={(value) => handleCustomChartChange('type', value)}
                  >
                    <SelectTrigger id="chart-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lpChartTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-source">Data Source</Label>
                  <Select
                    value={customChart.dataSource}
                    onValueChange={(value) => handleCustomChartChange('dataSource', value)}
                  >
                    <SelectTrigger id="data-source">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lpDataSourceOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chart-size">Chart Size</Label>
                  <Select
                    value={customChart.size || 'large'}
                    onValueChange={(value: 'small' | 'medium' | 'large') => handleCustomChartChange('size', value)}
                  >
                    <SelectTrigger id="chart-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large (Full Width)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Metrics</Label>
                  <div className="space-y-2">
                    {availableMetrics.map(metric => (
                      <div key={metric.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={metric.value}
                          checked={customChart.metrics.includes(metric.value)}
                          onChange={() => handleMetricToggle(metric.value)}
                          className="rounded"
                        />
                        <Label htmlFor={metric.value} className="cursor-pointer">
                          {metric.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column: Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {customChart.title || 'Chart Title'}
                    </CardTitle>
                    {customChart.description && (
                      <CardDescription>{customChart.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {renderChartPreview()}
                  </CardContent>
                </Card>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddCustomChart}
                disabled={!customChart.title || customChart.metrics.length === 0}
              >
                Add Chart
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
