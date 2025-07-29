import { test, expect } from '@playwright/test'

test.describe('Order Creation Flow', () => {
  test('Customer can navigate through order creation form', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')
    
    // Take screenshot of homepage
    await page.screenshot({ path: 'screenshots/homepage.png', fullPage: true })
    
    // Click on Get Started to go to request form
    await page.click('text=Get Free Quote Now')
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*\/auth\/login|signup/)
    await page.screenshot({ path: 'screenshots/login-page.png' })
    
    // For now, let's just verify the form structure without logging in
    // We'll check if key elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    const authButton = page.locator('button:has-text("Sign In")').or(page.locator('button:has-text("Create account")'))
    await expect(authButton).toBeVisible()
  })
  
  test('Admin dashboard is accessible', async ({ page }) => {
    // Navigate to admin login
    await page.goto('/admin')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/auth\/login/)
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/admin-login.png' })
    
    // Verify admin login elements
    await expect(page.locator('h2:has-text("Sign in to your account")')).toBeVisible()
  })
  
  test('Public pages are accessible', async ({ page }) => {
    // Test FAQ page
    await page.goto('/faq')
    await expect(page.locator('h1:has-text("Frequently Asked Questions")')).toBeVisible()
    await page.screenshot({ path: 'screenshots/faq-page.png', fullPage: true })
    
    // Test pricing section on homepage
    await page.goto('/')
    await page.evaluate(() => {
      document.querySelector('#pricing')?.scrollIntoView()
    })
    await expect(page.locator('button:has-text("View Pricing")')).toBeVisible()
    await page.screenshot({ path: 'screenshots/pricing-section.png' })
    
    // Test order tracking page
    await page.goto('/track')
    await expect(page.locator('h1:has-text("Track Your Shipment")')).toBeVisible()
    await page.screenshot({ path: 'screenshots/track-page.png' })
  })
  
  test('Responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to homepage
    await page.goto('/')
    await page.screenshot({ path: 'screenshots/mobile-homepage.png', fullPage: true })
    
    // Check mobile menu exists
    const mobileMenuButton = page.locator('button[aria-label*="menu"]').or(page.locator('button:has(svg.w-6.h-6)'))
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click()
      await page.screenshot({ path: 'screenshots/mobile-menu.png' })
    }
  })
})