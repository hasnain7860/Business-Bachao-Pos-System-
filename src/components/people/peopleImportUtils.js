// --- Private Helper Functions (Not exported) ---

const decodeQuotedPrintable = (input) => {
    if (!input) return "";
    input = input.replace(/=\r?\n/g, "");
    return input.replace(/=([A-Fa-f0-9]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
};

const extractPeopleFromVcfString = (vcfContent) => {
    const people = [];
    const entries = vcfContent.split("END:VCARD");

    entries.forEach(entry => {
      if (entry.includes("BEGIN:VCARD")) {
        let nameMatch = entry.match(/FN[:;]?(?:CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:)?(.*)/i);
        let phoneMatch = entry.match(/TEL[^:]*:(.*)/);
        let emailMatch = entry.match(/EMAIL[^:]*:(.*)/);
        let addressMatch = entry.match(/ADR[^:]*:(.*)/);

        let name = nameMatch ? decodeQuotedPrintable(nameMatch[1].trim()) : "Unknown";
        let phone = phoneMatch ? phoneMatch[1].trim() : "";
        let email = emailMatch ? emailMatch[1].trim() : "";
        let address = addressMatch ? decodeQuotedPrintable(addressMatch[1].trim()) : "";

        // Clean up phone number (optional: remove spaces/dashes if needed)
        // phone = phone.replace(/[^0-9+]/g, ""); 

        people.push({ name, phone, email, address });
      }
    });

    return people;
};

// --- Exported Functions ---

/**
 * Reads a VCF file and returns a Promise resolving to an array of people objects.
 * @param {File} file - The file object from input type="file"
 */
export const parseVcfFile = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject("No file provided");
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const content = event.target.result;
                const people = extractPeopleFromVcfString(content);
                resolve(people);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

/**
 * Trigger the browser's native Contact Picker API.
 * Returns a Promise resolving to an array of people objects.
 */
export const getPhoneContacts = async () => {
    if (!('contacts' in navigator && 'select' in navigator.contacts)) {
        throw new Error("Contact Picker API not supported");
    }

    const props = ['name', 'tel'];
    const opts = { multiple: true };

    const contacts = await navigator.contacts.select(props, opts);
    
    // Map native format to our App format
    return contacts.map(contact => ({
        name: contact.name?.[0] || "Unknown",
        phone: contact.tel?.[0] || "",
        email: "",
        address: ""
    })).filter(p => p.phone); // Only return contacts with phones
};

