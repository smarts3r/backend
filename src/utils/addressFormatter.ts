// utils/addressFormatter.ts
export const formatAddressToString = (
    address: any,
    phoneNumber: string
): string => {
    if (typeof address === 'string') {
        return address;
    }

    // NOTE: Format address to string
    const parts = [
        address.street,
        address.city,
        address.state,
        address.zip_code,
        address.country,
        `Phone: ${phoneNumber}`
    ].filter(Boolean);

    return parts.join(', ');
};

// NOTE: Or store as JSON for easier parsing later
export const formatAddressToJSON = (
    address: any,
    phoneNumber: string
): string => {
    if (typeof address === 'string') {
        try {

            JSON.parse(address);
            return address;
        } catch {

            return JSON.stringify({
                raw: address,
                phone: phoneNumber
            });
        }
    }

    return JSON.stringify({
        ...address,
        phone: phoneNumber,
        formatted: `${address.street}, ${address.city}, ${address.state} ${address.zip_code}, ${address.country}`
    });
};