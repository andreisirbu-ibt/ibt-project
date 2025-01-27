document.addEventListener("DOMContentLoaded", () => {
    const App = () => {
        document.getElementById("connect-eth").addEventListener("click", async () => {
            console.log("Ethereum connect button clicked.");
          
            if (window.ethereum) {
              try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                console.log("Accounts:", accounts);
                updateMessage(`Ethereum wallet connected: ${accounts[0]}`);
              } catch (err) {
                console.error("Error connecting Ethereum wallet:", err);
                updateMessage("Failed to connect Ethereum wallet.", true);
              }
            } else {
              console.error("MetaMask not detected.");
              updateMessage("Please install MetaMask.", true);
            }
        });

        
        document.getElementById("connect-sui").addEventListener("click", async () => {
            const suiWalletInstance = window.suiWallet;

            if (suiWalletInstance) {
                try {
                    const accounts = await suiWalletInstance.requestAccounts();
                    suiWallet = { address: accounts[0] };
                    updateMessage(`Sui wallet connected: ${accounts[0]}`);
                } catch (err) {
                    updateMessage("Failed to connect Sui wallet.", true);
                }
            } else {
                updateMessage("Please install the Sui Wallet.", true);
            }
        });

        document.getElementById("eth-to-sui").addEventListener("click", async () => {
            if (!ethWallet || !suiWallet) {
                updateMessage("Connect both wallets before bridging.", true);
                return;
            }

            const amount = document.getElementById("amount").value;
            if (!amount || isNaN(amount) || amount <= 0) {
                updateMessage("Enter a valid amount.", true);
                return;
            }

            toggleLoading(true);

            try {
                const ethSigner = ethWallet.provider.getSigner();
                const ethTokenContract = new ethers.Contract(ethTokenContractAddress, ethTokenABI, ethSigner);

                const burnTx = await ethTokenContract.burnTokens(suiWallet.address, ethers.utils.parseEther(amount));
                await burnTx.wait();

                const tx = new sui.TransactionBlock();
                tx.moveCall({
                target: `${suiPackageID}::bridge_module::mint_tokens`,
                arguments: [tx.pure(suiWallet.address), tx.pure(Number(amount))],
                });

                const suiKeypair = sui.Ed25519Keypair.deriveKeypair("Your Sui Private Key");
                await suiProvider.executeTransactionBlock({
                transactionBlock: tx,
                signer: suiKeypair,
                });

                updateMessage(`Successfully bridged ${amount} tokens to Sui.`);
            } catch (err) {
                updateMessage("Failed to bridge Ethereum to Sui.", true);
            } finally {
                toggleLoading(false);
            }
        });

        
        document.getElementById("sui-to-eth").addEventListener("click", async () => {
            if (!ethWallet || !suiWallet) {
                updateMessage("Connect both wallets before bridging.", true);
                return;
            }

            const amount = document.getElementById("amount").value;
            if (!amount || isNaN(amount) || amount <= 0) {
                updateMessage("Enter a valid amount.", true);
                return;
            }

            toggleLoading(true);

            try {
                const tx = new sui.TransactionBlock();
                tx.moveCall({
                target: `${suiPackageID}::bridge_module::burn_tokens`,
                arguments: [tx.pure(Number(amount))],
                });

                const suiKeypair = sui.Ed25519Keypair.deriveKeypair("Your Sui Private Key");
                await suiProvider.executeTransactionBlock({
                transactionBlock: tx,
                signer: suiKeypair,
                });

                const ethSigner = ethWallet.provider.getSigner();
                const ethTokenContract = new ethers.Contract(ethTokenContractAddress, ethTokenABI, ethSigner);
                const mintTx = await ethTokenContract.mintTokens(ethWallet.address, ethers.utils.parseEther(amount));
                await mintTx.wait();

                updateMessage(`Successfully bridged ${amount} tokens to Ethereum.`);
            } catch (err) {
                updateMessage("Failed to bridge Sui to Ethereum.", true);
            } finally {
                toggleLoading(false);
            }
        });


    };
  
    const updateMessage = (message, isError = false) => {
        const messageElement = document.getElementById("message");
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.style.color = isError ? 'red' : 'green';
        }
    };

    App();
});
