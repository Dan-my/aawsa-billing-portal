import { NextResponse } from 'next/server';
import { 
  getIndividualCustomerReadings, 
  initializeIndividualCustomerReadings,
  getCustomers,
  initializeCustomers
} from '@/lib/data-store';

interface Params {
  params: {
    customerKeyNumber: string;
  }
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { customerKeyNumber } = params;

    if (!customerKeyNumber) {
      return NextResponse.json(
        { success: false, message: 'Customer Key Number is required.' },
        { status: 400 }
      );
    }

    // Ensure data stores are initialized
    await initializeCustomers();
    await initializeIndividualCustomerReadings();

    // Check if the customer exists
    const customer = getCustomers().find(c => c.customerKeyNumber === customerKeyNumber);
    if (!customer) {
      return NextResponse.json(
        { success: false, message: `Customer with key '${customerKeyNumber}' not found.` },
        { status: 404 }
      );
    }

    // Get all readings and filter for the specific customer
    const allReadings = getIndividualCustomerReadings();
    const customerReadings = allReadings.filter(reading => reading.individualCustomerId === customerKeyNumber);

    if (customerReadings.length === 0) {
      return NextResponse.json(
        { success: true, message: `No readings found for customer '${customerKeyNumber}'.`, data: [] },
        { status: 200 }
      );
    }
    
    // Return the readings as a successful JSON response
    return NextResponse.json({ success: true, data: customerReadings });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error("API Error fetching customer readings:", errorMessage);
    // Return an error response if something goes wrong
    return NextResponse.json(
        { success: false, message: 'Failed to fetch customer readings.', error: errorMessage }, 
        { status: 500 }
    );
  }
}
