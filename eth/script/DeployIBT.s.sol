// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/IBTToken.sol";

contract DeployIBT is Script {
    function run() external {
        address deployer = vm.envAddress("DEPLOYER_ADDRESS"); // Read deployer address from environment
        vm.startBroadcast();

        // Deploy the IBTToken contract
        IBTToken ibtToken = new IBTToken(deployer);
        console.log("IBTToken deployed at:", address(ibtToken));

        vm.stopBroadcast();
    }
}
