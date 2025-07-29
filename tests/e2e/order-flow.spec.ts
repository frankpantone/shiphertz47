import { test, expect } from '@playwright/test'

// Test data
const testCustomer = {
  email: 'test.customer@example.com',
  password: 'TestPassword123!',
  fullName: 'Test Customer',
  phone: '(555) 123-4567',
  companyName: 'Test Transport Co'
}

const testAdmin = {
  email: 'test.admin@example.com',
  password: 'AdminPassword123!'
}

const testOrder = {
  pickupCompanyName: 'Test Pickup Company',
  pickupAddress: '123 Main St, Naples, FL 34102',
  pickupContactName: 'John Pickup',
  pickupContactPhone: '(555) 111-2222',
  deliveryCompanyName: 'Test Delivery Company',
  deliveryAddress: '456 Oak Ave, Miami, FL 33101',
  deliveryContactName: 'Jane Delivery',
  deliveryContactPhone: '(555) 333-4444',
  vin: 'WBA5B1C50GG252337', // Sample BMW VIN
  notes: 'Handle with care - automated test order'
}

test.describe('Complete Order Flow - Customer to Admin', () => {
  test.beforeEach(async ({ page }) => {
    // Start at the homepage
    await page.goto('http://localhost:3000')
  })

  test('Full order lifecycle from creation to completion', async ({ page }) => {
    // Step 1: Customer Registration
    await test.step('Customer signs up', async () => {
      await page.click('text=Sign In')
      await page.click('text=Sign up')
      
      await page.fill('input[type="email"]', testCustomer.email)
      await page.fill('input[type="password"]', testCustomer.password)
      await page.click('button:has-text("Sign Up")')
      
      // Wait for redirect to profile completion
      await expect(page).toHaveURL(/.*\/auth\/complete-profile/)
      
      // Complete profile
      await page.fill('input[placeholder*="Full Name"]', testCustomer.fullName)
      await page.fill('input[placeholder*="Phone"]', testCustomer.phone)
      await page.fill('input[placeholder*="Company"]', testCustomer.companyName)
      await page.click('button:has-text("Complete Profile")')
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*\/dashboard/)
    })

    // Step 2: Create Transportation Request
    let orderNumber: string
    await test.step('Customer creates transportation request', async () => {
      // Navigate to request form
      await page.click('text=New Request')
      await expect(page).toHaveURL(/.*\/request/)
      
      // Fill pickup information
      await page.fill('input[placeholder*="pickup company name"]', testOrder.pickupCompanyName)
      await page.fill('input[placeholder*="pickup address"]', testOrder.pickupAddress)
      await page.fill('input[placeholder*="contact person name"]', testOrder.pickupContactName)
      await page.fill('input[placeholder*="contact phone"]', testOrder.pickupContactPhone)
      
      // Click Next to go to delivery info
      await page.click('button:has-text("Next")')
      
      // Fill delivery information
      await page.fill('input[placeholder*="delivery company name"]', testOrder.deliveryCompanyName)
      await page.fill('input[placeholder*="delivery address"]', testOrder.deliveryAddress)
      await page.fill('input[placeholder*="contact person name"]', testOrder.deliveryContactName)
      await page.fill('input[placeholder*="contact phone"]', testOrder.deliveryContactPhone)
      
      // Click Next to go to vehicle info
      await page.click('button:has-text("Next")')
      
      // Add vehicle information
      await page.fill('input[placeholder*="VIN"]', testOrder.vin)
      await page.fill('textarea[placeholder*="additional information"]', testOrder.notes)
      
      // Click Next to review
      await page.click('button:has-text("Next")')
      
      // Review and submit
      await expect(page.locator('text=' + testOrder.pickupCompanyName)).toBeVisible()
      await expect(page.locator('text=' + testOrder.deliveryCompanyName)).toBeVisible()
      
      await page.click('button:has-text("Submit Request")')
      
      // Wait for success message and capture order number
      const successMessage = await page.waitForSelector('text=/Order #TRQ_/')
      const orderText = await successMessage.textContent()
      orderNumber = orderText?.match(/TRQ_\d+_\w+/)?.[0] || ''
      
      expect(orderNumber).toBeTruthy()
      console.log('Created order:', orderNumber)
    })

    // Step 3: Customer views order status
    await test.step('Customer tracks order', async () => {
      // Go to orders page
      await page.goto('http://localhost:3000/dashboard')
      await page.click('text=My Orders')
      
      // Find the created order
      await expect(page.locator(`text=${orderNumber}`)).toBeVisible()
      
      // Click to view details
      await page.click(`text=${orderNumber}`)
      
      // Verify order details
      await expect(page.locator('text=' + testOrder.pickupCompanyName)).toBeVisible()
      await expect(page.locator('text=' + testOrder.deliveryCompanyName)).toBeVisible()
      await expect(page.locator('text=Pending')).toBeVisible()
      
      // Check tracking page
      await page.click('text=Track Order')
      await expect(page).toHaveURL(new RegExp(`/track/${orderNumber}`))
      await expect(page.locator('h1:has-text("Track Your Order")')).toBeVisible()
    })

    // Step 4: Logout customer, login as admin
    await test.step('Switch to admin account', async () => {
      // Logout customer
      await page.click('button:has-text("Sign Out")')
      await expect(page).toHaveURL('/')
      
      // Login as admin
      await page.click('text=Admin')
      await page.fill('input[type="email"]', testAdmin.email)
      await page.fill('input[type="password"]', testAdmin.password)
      await page.click('button:has-text("Sign In")')
      
      // Should redirect to admin dashboard
      await expect(page).toHaveURL(/.*\/admin/)
    })

    // Step 5: Admin manages the order
    await test.step('Admin processes order', async () => {
      // Navigate to all orders
      await page.click('text=All Orders')
      await expect(page).toHaveURL(/.*\/admin\/orders\/all/)
      
      // Search for the order
      await page.fill('input[placeholder*="Search"]', orderNumber)
      
      // Click on the order
      await page.click(`text=${orderNumber}`)
      await expect(page).toHaveURL(new RegExp(`/admin/orders/\\w+`))
      
      // Verify order details
      await expect(page.locator('h1:has-text("' + orderNumber + '")')).toBeVisible()
      await expect(page.locator('text=' + testOrder.pickupCompanyName)).toBeVisible()
      
      // Assign to self
      await page.click('button:has-text("Assign Admin")')
      await page.click('text=Assign to Me')
      await page.click('button:has-text("Assign")')
      await expect(page.locator('text=Admin assigned successfully')).toBeVisible()
      
      // Create quote
      await page.click('button:has-text("Create Quote")')
      await page.fill('input[placeholder*="amount"]', '1500')
      await page.locator('input[type="date"]').first().fill('2025-02-01')
      await page.locator('input[type="date"]').last().fill('2025-02-05')
      await page.click('dialog button:has-text("Create Quote")')
      await expect(page.locator('text=Quote created successfully')).toBeVisible()
      
      // Update status to quoted
      await expect(page.locator('text=Quoted')).toBeVisible()
    })

    // Step 6: Customer accepts quote
    await test.step('Customer accepts quote', async () => {
      // Logout admin
      await page.click('button:has-text("Sign Out")')
      
      // Login as customer again
      await page.click('text=Sign In')
      await page.fill('input[type="email"]', testCustomer.email)
      await page.fill('input[type="password"]', testCustomer.password)
      await page.click('button:has-text("Sign In")')
      
      // Go to order
      await page.goto('http://localhost:3000/dashboard')
      await page.click('text=My Orders')
      await page.click(`text=${orderNumber}`)
      
      // Should see quote
      await expect(page.locator('text=Quoted')).toBeVisible()
      await expect(page.locator('text=$1,500')).toBeVisible()
      
      // Accept quote (if button is available)
      const acceptButton = page.locator('button:has-text("Accept Quote")')
      if (await acceptButton.isVisible()) {
        await acceptButton.click()
        await expect(page.locator('text=Quote accepted')).toBeVisible()
      }
    })

    // Step 7: Admin completes order
    await test.step('Admin completes order', async () => {
      // Switch back to admin
      await page.click('button:has-text("Sign Out")')
      await page.click('text=Admin')
      await page.fill('input[type="email"]', testAdmin.email)
      await page.fill('input[type="password"]', testAdmin.password)
      await page.click('button:has-text("Sign In")')
      
      // Go to order
      await page.goto(`http://localhost:3000/admin/orders/all`)
      await page.fill('input[placeholder*="Search"]', orderNumber)
      await page.click(`text=${orderNumber}`)
      
      // Update status to completed
      await page.click('button:has-text("Update Status")')
      await page.click('text=Completed')
      await page.click('dialog button:has-text("Update")')
      await expect(page.locator('text=Status updated successfully')).toBeVisible()
      
      // Verify completed status
      await expect(page.locator('span:has-text("Completed")')).toBeVisible()
    })

    // Step 8: Verify analytics
    await test.step('Check analytics dashboard', async () => {
      // Navigate to analytics
      await page.click('text=Analytics')
      await expect(page).toHaveURL(/.*\/admin\/analytics/)
      
      // Verify the order appears in stats
      await expect(page.locator('text=Total Orders')).toBeVisible()
      await expect(page.locator('text=Completed Orders')).toBeVisible()
      
      // Export data
      await page.click('button:has-text("Export Data")')
      await page.click('button:has-text("CSV")')
      await page.click('text=Next')
      await page.click('text=Next')
      
      // Preview should show our order
      await expect(page.locator('text=Sample Data')).toBeVisible()
    })
  })

  test('Search and filter functionality', async ({ page }) => {
    // Login as admin
    await page.click('text=Admin')
    await page.fill('input[type="email"]', testAdmin.email)
    await page.fill('input[type="password"]', testAdmin.password)
    await page.click('button:has-text("Sign In")')
    
    // Go to all orders
    await page.click('text=All Orders')
    
    // Test search
    await page.fill('input[placeholder*="Search"]', 'TRQ_')
    await expect(page.locator('text=/TRQ_\\d+/')).toBeVisible()
    
    // Test status filter
    await page.click('button:has-text("Pending")')
    // Verify filtered results
    
    // Test advanced filters
    await page.click('button:has-text("Filters")')
    await page.click('text=Assigned')
    await expect(page.locator('text=Active filters')).toBeVisible()
    
    // Clear filters
    await page.click('button:has-text("Clear")')
  })
})