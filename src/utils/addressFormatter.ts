
export const formatAddressToString = (
    address: any,
    phoneNumber: string
): string => {
    if (typeof address === 'string') {
        return address;
    }

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