const keyManager = require('./key-manager');
const TRANSFER_AMOUNT = process.env.TRANSFER_AMOUNT || 2500000000;

(async function () {

    // Managing a lost or stolen key

    // In this example the 2 additional accounts will be added to
    // the main account. Main account will hold a 'safe key',
    // First account will hold a browser key and second account will hold
    // a mobile key. After mobile phone is stolen, the safe key will be used
    // to remove a mobile key from the account.

    // To achive the task, we will:
    // 1. Set Keys Management Threshold to 3.
    // 2. Set Deploy Threshold to 2.
    // 3. Set mobile and browser account weight to 1.
    // 4. Set main account weight to 3.
    // 5. Make a transfer from mainAccount to thirdAccount using mobile & browser accounts.
    // 6. Remove mobile key from the account
    // 7. Try to make another transfer with a stolen mobile key

    // 1, 2, 3 will be done in one step.

    const masterKey = keyManager.randomMasterKey();
    const mainAccount = masterKey.deriveIndex(1);
    const firstAccount = masterKey.deriveIndex(2);
    const secondAccount = masterKey.deriveIndex(3);
    const thirdAccount = masterKey.deriveIndex(4);

    console.log("Main account: " + mainAccount.publicKey.toHex());
    console.log("First account: " + firstAccount.publicKey.toHex());
    console.log("Second account: " + secondAccount.publicKey.toHex());
    console.log("Third account: " + thirdAccount.publicKey.toHex());

    console.log("\n[x] Funding main account.");
    await keyManager.fundAccount(mainAccount);
    await keyManager.printAccount(mainAccount);

    console.log("\n[x] Install Keys Manager contract");
    let deploy = keyManager.keys.buildContractInstallDeploy(mainAccount);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);

    // Deploy threshold is 2 out of 4
    const deployThereshold = 2;
    // Key Managment threshold is 3 out of 4
    const keyManagementThreshold = 3;
    // 
    const accounts = [
        { publicKey: mainAccount.publicKey, weight: 3 },
        { publicKey: firstAccount.publicKey, weight: 1 },
        { publicKey: secondAccount.publicKey, weight: 1 },
    ];

    console.log("\n[x] Update keys deploy.");
    deploy = keyManager.keys.setAll(mainAccount, deployThereshold, keyManagementThreshold, accounts);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);

    console.log("\n[x] Make transfer.");
    deploy = keyManager.transferDeploy(mainAccount, thirdAccount, TRANSFER_AMOUNT);
    await keyManager.sendDeploy(deploy, [firstAccount, secondAccount]);
    await keyManager.printAccount(mainAccount);

    console.log("\nRemove stolen mobile key by setting its weight to 0 and set thirdAccount key as a new mobile key")
    const updated_accounts = [
        { publicKey: mainAccount.publicKey, weight: 3 },
        { publicKey: firstAccount.publicKey, weight: 1 },
        { publicKey: secondAccount.publicKey, weight: 0 },
        { publicKey: thirdAccount.publicKey, weight: 1 },
    ];

    deploy = keyManager.keys.setAll(mainAccount, deployThereshold, keyManagementThreshold, updated_accounts);
    await keyManager.sendDeploy(deploy, [mainAccount]);
    await keyManager.printAccount(mainAccount);

    console.log("\n[x] Try to make transfer with a stolen key.");
    deploy = keyManager.transferDeploy(mainAccount, thirdAccount, TRANSFER_AMOUNT);
    await keyManager.sendDeploy(deploy, [firstAccount, secondAccount]);
    await keyManager.printAccount(mainAccount);

})();
