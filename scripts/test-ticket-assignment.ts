/**
 * Test script to simulate ticket assignment
 * Run with: npx ts-node scripts/test-ticket-assignment.ts
 */

async function testTicketAssignment() {
  const baseUrl = 'http://localhost:3000'
  
  try {
    console.log('🔍 Testing ticket assignment flow...\n')
    
    // Step 1: Fetch a service ticket
    console.log('Step 1: Fetching service tickets...')
    const ticketsResponse = await fetch(`${baseUrl}/api/service-tickets?location=all&canSeeAll=true&userRole=admin&userId=test-admin`)
    const ticketsData = await ticketsResponse.json()
    
    if (!ticketsData.tickets || ticketsData.tickets.length === 0) {
      console.log('❌ No tickets found in database')
      return
    }
    
    const testTicket = ticketsData.tickets[0]
    console.log(`✅ Found ticket: ${testTicket.ticket_number} - ${testTicket.title || testTicket.subject}`)
    console.log(`   Status: ${testTicket.status}, Location: ${testTicket.location}\n`)
    
    // Step 2: Fetch IT staff
    console.log('Step 2: Fetching IT staff...')
    const staffResponse = await fetch(`${baseUrl}/api/staff/list?role=staff_roles&location=all&userRole=admin`)
    const staffData = await staffResponse.json()
    
    if (!staffData.staff || staffData.staff.length === 0) {
      console.log('❌ No IT staff found in database')
      return
    }
    
    console.log(`✅ Found ${staffData.staff.length} IT staff members`)
    const testStaff = staffData.staff[0]
    console.log(`   Assigning to: ${testStaff.name} (${testStaff.role})`)
    console.log(`   Email: ${testStaff.email}, Phone: ${testStaff.phone}\n`)
    
    // Step 3: Assign the ticket
    console.log('Step 3: Assigning ticket...')
    const assignmentPayload = {
      ticketId: testTicket.id,
      assigneeId: testStaff.id,
      assignee: testStaff.name,
      assigneeEmail: testStaff.email,
      assigneePhone: testStaff.phone,
      priority: 'medium',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      instructions: 'Test assignment - please investigate and resolve',
      assignedBy: 'Admin User',
      assignedById: 'test-admin-id',
      notifyEmail: true,
      notifySMS: false,
    }
    
    console.log('Assignment payload:', JSON.stringify(assignmentPayload, null, 2))
    
    const assignResponse = await fetch(`${baseUrl}/api/service-tickets/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignmentPayload),
    })
    
    const assignResult = await assignResponse.json()
    
    if (!assignResponse.ok) {
      console.log(`❌ Assignment failed: ${assignResult.error}`)
      console.log('Response:', JSON.stringify(assignResult, null, 2))
      return
    }
    
    console.log('✅ Ticket assigned successfully!')
    console.log('Result:', JSON.stringify(assignResult, null, 2))
    
    // Step 4: Verify the assignment from the admin view
    console.log('\nStep 4: Verifying assignment (admin fetch)...')
    const verifyResponse = await fetch(`${baseUrl}/api/service-tickets?location=all&canSeeAll=true&userRole=admin&userId=test-admin`)
    const verifyData = await verifyResponse.json()
    
    const updatedTicket = verifyData.tickets.find((t: any) => t.id === testTicket.id)
    
    if (updatedTicket && updatedTicket.assigned_to === testStaff.id) {
      console.log('✅ Assignment verified!')
      console.log(`   Ticket ${updatedTicket.ticket_number} is now assigned to ${updatedTicket.assigned_to_name}`)
      console.log(`   Status: ${updatedTicket.status}`)
    } else {
      console.log('❌ Assignment verification failed')
      console.log('Updated ticket:', JSON.stringify(updatedTicket, null, 2))
    }

    // Step 5: Simulate the assigned staff member fetching tickets using their own
    // location filter.  Prior to the fix this request would not return a ticket
    // assigned to them if its location did not match; after the fix it should.
    console.log('\nStep 5: Verifying staff can see their assigned ticket via their own filter...')
    const staffFetchUrl = `${baseUrl}/api/service-tickets?location=${encodeURIComponent(testStaff.location || '')}&canSeeAll=false&userRole=${encodeURIComponent(testStaff.role)}&userId=${encodeURIComponent(testStaff.id)}`
    const staffViewResponse = await fetch(staffFetchUrl)
    const staffViewData = await staffViewResponse.json()
    const staffVisible = staffViewData.tickets && staffViewData.tickets.some((t: any) => t.id === testTicket.id)
    if (staffVisible) {
      console.log('✅ Staff can see the ticket when fetching with their own location filter.')
    } else {
      console.log('⚠️ Staff could NOT see the ticket using their own filter (this was the reported issue).')
      console.log('Staff fetch url:', staffFetchUrl)
      console.log('Returned tickets:', JSON.stringify(staffViewData.tickets || [], null, 2))
    }
    
    console.log('\n✨ Test completed!')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
  }
}

// Run the test
testTicketAssignment()
