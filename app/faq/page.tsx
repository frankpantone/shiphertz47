'use client'

import { useState } from 'react'
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  QuestionMarkCircleIcon,
  TruckIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClockIcon,
  PhoneIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { Card, Button } from '@/components/ui'

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
  icon: any
}

const faqs: FAQItem[] = [
  // Pricing & Quotes
  {
    id: '1',
    category: 'Pricing & Quotes',
    question: 'How is the shipping cost calculated?',
    answer: 'Shipping costs are calculated based on several factors: distance between pickup and delivery locations, vehicle size and type, transport method (open or enclosed), current fuel prices, and seasonal demand. We provide transparent, all-inclusive quotes with no hidden fees.',
    icon: CurrencyDollarIcon
  },
  {
    id: '2',
    category: 'Pricing & Quotes',
    question: 'Are there any hidden fees?',
    answer: 'No, we believe in complete transparency. Our quotes include all costs: carrier fees, insurance, fuel surcharges, and taxes. The price you see is the price you pay. The only additional cost might be expedited shipping if you request it after booking.',
    icon: CurrencyDollarIcon
  },
  {
    id: '3',
    category: 'Pricing & Quotes',
    question: 'When do I pay for the service?',
    answer: 'We require a small deposit (typically $100-200) to secure your booking. The remaining balance is due upon delivery of your vehicle. We accept credit cards, debit cards, and bank transfers. No payment is collected until your vehicle is safely delivered.',
    icon: CurrencyDollarIcon
  },
  
  // Shipping Process
  {
    id: '4',
    category: 'Shipping Process',
    question: 'How long does shipping take?',
    answer: 'Shipping times vary by distance: Coast-to-coast typically takes 7-10 days, regional routes (500-1500 miles) take 3-5 days, and local deliveries (under 500 miles) usually take 1-2 days. Express shipping options are available for faster delivery.',
    icon: ClockIcon
  },
  {
    id: '5',
    category: 'Shipping Process',
    question: 'How do I prepare my vehicle for shipping?',
    answer: 'Clean your vehicle inside and out, remove all personal items, ensure the gas tank is about 1/4 full, disable alarm systems, document any existing damage with photos, and ensure your vehicle is in running condition. We\'ll provide a detailed checklist upon booking.',
    icon: TruckIcon
  },
  {
    id: '6',
    category: 'Shipping Process',
    question: 'Can I track my vehicle during transport?',
    answer: 'Yes! We provide real-time tracking for all shipments. You\'ll receive a tracking number and can monitor your vehicle\'s location 24/7 through our website or mobile app. You\'ll also receive automated updates at key milestones.',
    icon: TruckIcon
  },
  
  // Insurance & Safety
  {
    id: '7',
    category: 'Insurance & Safety',
    question: 'Is my vehicle insured during transport?',
    answer: 'Yes, all vehicles are covered by our comprehensive cargo insurance up to $1 million. This covers any damage that might occur during transport. For high-value vehicles, additional insurance coverage is available. Your personal auto insurance remains in effect as secondary coverage.',
    icon: ShieldCheckIcon
  },
  {
    id: '8',
    category: 'Insurance & Safety',
    question: 'What happens if my vehicle is damaged?',
    answer: 'While damage is extremely rare (less than 0.5% of shipments), we take it seriously. Document any damage immediately upon delivery, notify the driver and take photos, contact us within 24 hours, and we\'ll handle the insurance claim process for you. Most claims are resolved within 7-10 business days.',
    icon: ShieldCheckIcon
  },
  {
    id: '9',
    category: 'Insurance & Safety',
    question: 'Are your carriers licensed and vetted?',
    answer: 'Absolutely. All our carriers are fully licensed by the DOT and FMCSA, maintain proper insurance coverage, undergo background checks, and have excellent safety records. We only work with carriers who meet our strict quality standards.',
    icon: ShieldCheckIcon
  },
  
  // Booking & Changes
  {
    id: '10',
    category: 'Booking & Changes',
    question: 'Can I change my pickup or delivery date?',
    answer: 'Yes, we understand plans can change. You can modify your dates up to 48 hours before the scheduled pickup without any fees. Changes made within 48 hours may incur a rescheduling fee. We\'ll work with you to find the best alternative dates.',
    icon: DocumentTextIcon
  },
  {
    id: '11',
    category: 'Booking & Changes',
    question: 'What if I need to cancel my booking?',
    answer: 'You can cancel your booking anytime before the carrier is dispatched for a full refund of your deposit. Once the carrier is assigned (typically 24-48 hours before pickup), a cancellation fee may apply. We recommend contacting us as soon as possible if you need to cancel.',
    icon: DocumentTextIcon
  },
  {
    id: '12',
    category: 'Booking & Changes',
    question: 'Do you ship to/from Hawaii or Alaska?',
    answer: 'Yes, we provide shipping services to and from Hawaii and Alaska. These routes require a combination of ground transport and ocean freight, which extends the shipping time to 2-4 weeks. Special pricing applies for these routes due to the additional logistics involved.',
    icon: TruckIcon
  }
]

const categories = [
  { name: 'All Topics', icon: QuestionMarkCircleIcon },
  { name: 'Pricing & Quotes', icon: CurrencyDollarIcon },
  { name: 'Shipping Process', icon: TruckIcon },
  { name: 'Insurance & Safety', icon: ShieldCheckIcon },
  { name: 'Booking & Changes', icon: DocumentTextIcon }
]

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Topics')
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'All Topics' || faq.category === selectedCategory
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about our auto transport services. 
            Can't find what you're looking for? Contact our support team.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <QuestionMarkCircleIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`
                  flex items-center px-4 py-2 rounded-lg font-medium transition-colors
                  ${selectedCategory === category.name
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5 mr-2" />
                {category.name}
              </button>
            )
          })}
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto">
          {filteredFAQs.length === 0 ? (
            <Card className="text-center py-12">
              <QuestionMarkCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No FAQs found matching your search.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredFAQs.map((faq) => {
                const Icon = faq.icon
                const isExpanded = expandedItems.includes(faq.id)
                
                return (
                  <Card key={faq.id} className="overflow-hidden">
                    <button
                      onClick={() => toggleExpanded(faq.id)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                          <Icon className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                          <p className="text-sm text-gray-500">{faq.category}</p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    
                    {isExpanded && (
                      <div className="px-6 pb-4 pt-0">
                        <div className="ml-14 text-gray-700 leading-relaxed">
                          {faq.answer}
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto p-8 bg-gradient-to-r from-primary-50 to-trust-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Still Have Questions?
            </h2>
            <p className="text-gray-600 mb-6">
              Our customer support team is here to help you 24/7 with any questions about your auto transport.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => window.open('tel:1-800-SHIP-CAR', '_self')}
                icon={<PhoneIcon className="h-5 w-5" />}
              >
                Call: 1-800-SHIP-CAR
              </Button>
              <Button 
                variant="secondary"
                onClick={() => window.location.href = 'mailto:support@shiphertz.com'}
              >
                Email Support
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}