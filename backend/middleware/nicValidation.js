function validateNIC(nationalIdCardNumber) {
    nationalIdCardNumber = nationalIdCardNumber.toUpperCase();
    const currentYear = new Date().getFullYear();
    let birthYear = null;

    if (nationalIdCardNumber.endsWith('V') || nationalIdCardNumber.endsWith('X')) {
        if (nationalIdCardNumber.length !== 10) {
            throw new Error("Invalid old NIC format: Incorrect length.");
        }

        let firstTwoDigits = parseInt(nationalIdCardNumber.substring(0, 2), 10);
        if (isNaN(firstTwoDigits)) {
            throw new Error("Invalid NIC digits in old NIC format.");
        }
        birthYear = 1900 + firstTwoDigits;

    } else {
        if (nationalIdCardNumber.length !== 12) {
            throw new Error("Invalid new NIC format: Incorrect length.");
        }
        birthYear = parseInt(nationalIdCardNumber.substring(0, 4), 10);
        if (isNaN(birthYear)) {
            throw new Error("Invalid NIC digits in new NIC format.");
        }
    }

    let age = currentYear - birthYear;
    let isFake = age < 16 || age > 100;

    return { age, isFake };
}

module.exports = validateNIC;