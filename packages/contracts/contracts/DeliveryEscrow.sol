// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract DeliveryEscrow {
    enum EscrowState { HELD_IN_ESCROW, DISPUTED, RELEASED, REFUNDED }

    address public immutable buyer;
    address public immutable vendor;
    address public immutable relayer;
    address public immutable tokenAddress;
    uint256 public immutable amount;

    EscrowState public state;
    bool private locked;

    event EscrowFunded(address indexed buyer, uint256 amount);
    event FundsReleased(address indexed vendor, uint256 amount);
    event FundsRefunded(address indexed buyer, uint256 amount);
    event DisputeRaised(address indexed buyer);

    modifier nonReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyBuyerOrRelayer() {
        require(msg.sender == buyer || msg.sender == relayer, "Unauthorized access");
        _;
    }

    constructor(
        address _buyer,
        address _vendor,
        address _relayer,
        address _tokenAddress,
        uint256 _amount
    ) {
        buyer = _buyer;
        vendor = _vendor;
        relayer = _relayer;
        tokenAddress = _tokenAddress;
        amount = _amount;
        state = EscrowState.HELD_IN_ESCROW;
    }

    function confirmDelivery() external onlyBuyerOrRelayer nonReentrant {
        require(state == EscrowState.HELD_IN_ESCROW, "Invalid state transition");
        state = EscrowState.RELEASED;
        require(IERC20(tokenAddress).transfer(vendor, amount), "Token transfer failed");
        emit FundsReleased(vendor, amount);
    }

    function raiseDispute() external onlyBuyerOrRelayer nonReentrant {
        require(state == EscrowState.HELD_IN_ESCROW, "Cannot dispute");
        state = EscrowState.DISPUTED;
        emit DisputeRaised(buyer);
    }

    function resolveRefund() external nonReentrant {
        require(msg.sender == relayer, "Only relayer can resolve refund");
        require(state == EscrowState.DISPUTED, "Order must be disputed");
        state = EscrowState.REFUNDED;
        require(IERC20(tokenAddress).transfer(buyer, amount), "Refund transfer failed");
        emit FundsRefunded(buyer, amount);
    }
}