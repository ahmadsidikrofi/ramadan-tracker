import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const lat = searchParams.get('latitude');
        const lon = searchParams.get('longitude');
        const cityId = searchParams.get('cityId'); // Just in case we need it
        const date = searchParams.get('date');

        // Build base URL
        let url = `http://loscos4w40ko04sss0cg0wo4.70.153.72.107.sslip.io/prayer?`;

        const params = new URLSearchParams();
        if (lat) params.append("latitude", lat);
        if (lon) params.append("longitude", lon);
        if (cityId) params.append("cityId", cityId);
        if (date) params.append("date", date);

        // Add params to URL
        url += params.toString();

        const response = await fetch(url, {
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
        return NextResponse.json({ error: "Failed to fetch prayer API", details: error.message }, { status: 500 });
    }
}
