// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./DeliveryEscrow.sol";

contract EscrowFactory {
    address public immutable relayer;
    event EscrowCreated(address indexed escrowContract, address indexed buyer, address indexed vendor, uint256 amount);

    constructor(address _relayer) {
        relayer = _relayer;
    }

    function createEscrow(
        address _vendor,
        address _tokenAddress,
        uint256 _amount
    ) external returns (address) {
        DeliveryEscrow escrow = new DeliveryEscrow(
            msg.sender,
            _vendor,
            relayer,
            _tokenAddress,
            _amount
        );
        require(
            IERC20(_tokenAddress).transferFrom(msg.sender, address(escrow), _amount),
            "Initial funding transfer failed"
        );
        emit EscrowCreated(address(escrow), msg.sender, _vendor, _amount);
        return address(escrow);
    }
}