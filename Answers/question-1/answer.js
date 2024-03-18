function rentContainers(neededContainer, listings) {
    // Calculate cost per container for each provider
    listings.forEach(provider => {
        provider.costPerContainer = provider.totalCost / provider.container;
    });

    // Sort the list of providers based on cost per container in ascending order
    listings.sort((a, b) => a.costPerContainer - b.costPerContainer);

    let rentedContainers = [];
    let totalCost = 0;

    // Iterate through the sorted list of providers
    for (const provider of listings) {
        // If needed containers are greater than 0
        if (neededContainer > 0) {
            // Rent all containers from the provider if possible
            const rented = Math.min(provider.container, neededContainer);
            rentedContainers.push({
                name: provider.name,
                rented: rented,
                price: rented * provider.costPerContainer
            });
            // Update the total cost
            totalCost += rented * provider.costPerContainer;
            // Subtract rented containers from needed containers
            neededContainer -= rented;
        } else {
            break; // Exit the loop if all needed containers are rented
        }
    }

    // Output the result
    if (neededContainer === 0) {
        console.log("Optimal contract:");
        for (const contract of rentedContainers) {
            console.log(`[Contract with] ${contract.name} ${contract.rented} container, price: ${contract.price}`);
        }
        console.log(`[Summary] total cost ${totalCost}`);
    } else {
        console.log("Not enough containers");
    }
}

// Test cases
console.log("Test case 1:")
const neededContainer1 = 3;
const listings1 = [
    { name: "Container renter A", container: 1, totalCost: 1 },
    { name: "Container renter B", container: 2, totalCost: 1 },
    { name: "Container renter C", container: 3, totalCost: 3 },
];
rentContainers(neededContainer1, listings1);

console.log("Test case 2:")
const neededContainer2 = 10;
const listings2 = [
    { name: "Container renter A", container: 5, totalCost: 5 },
    { name: "Container renter B", container: 2, totalCost: 10 },
    { name: "Container renter C", container: 2, totalCost: 3 },
];
rentContainers(neededContainer2, listings2);


console.log("Test case 3:")
const neededContainer3 = 10;
const listings3 = [
    { name: "Container renter A", container: 5, totalCost: 5 },
    { name: "Container renter B", container: 2, totalCost: 10 },
    { name: "Container renter C", container: 10, totalCost: 3 },
];
rentContainers(neededContainer3, listings3);

