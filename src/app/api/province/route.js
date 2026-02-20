import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch("http://loscos4w40ko04sss0cg0wo4.70.153.72.107.sslip.io/province", {
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            return NextResponse.json({ error: `API responded with status: ${response.status}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch provinces API", details: error.message }, { status: 500 });
    }
}
