// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LandRegistry {
    address public authority;

    struct Land {
        uint landId;
        string location;
        string area;
        address currentOwner;
        string documentHash;
        bool isRegistered;
        uint registeredAt;
    }

    struct Transaction {
        address from;
        address to;
        uint timestamp;
        string txType; // "REGISTER" or "TRANSFER"
    }

    mapping(uint => Land) public lands;
    mapping(uint => address[]) public ownershipHistory;
    mapping(uint => Transaction[]) public landTransactions;
    uint[] public allLandIds;

    event LandRegistered(uint indexed landId, address indexed owner, string location);
    event LandTransferred(uint indexed landId, address indexed from, address indexed to);

    modifier onlyAuthority() {
        require(msg.sender == authority, "Only authority can perform this action");
        _;
    }

    modifier landExists(uint _landId) {
        require(lands[_landId].isRegistered, "Land not registered");
        _;
    }

    constructor() {
        authority = msg.sender;
    }

    function registerLand(
        uint _landId,
        string memory _location,
        string memory _area,
        address _owner,
        string memory _documentHash
    ) public onlyAuthority {
        require(!lands[_landId].isRegistered, "Land already registered");

        lands[_landId] = Land({
            landId: _landId,
            location: _location,
            area: _area,
            currentOwner: _owner,
            documentHash: _documentHash,
            isRegistered: true,
            registeredAt: block.timestamp
        });

        ownershipHistory[_landId].push(_owner);
        allLandIds.push(_landId);

        landTransactions[_landId].push(Transaction({
            from: authority,
            to: _owner,
            timestamp: block.timestamp,
            txType: "REGISTER"
        }));

        emit LandRegistered(_landId, _owner, _location);
    }

    function transferLand(uint _landId, address _newOwner)
        public
        landExists(_landId)
    {
        Land storage land = lands[_landId];
        require(msg.sender == land.currentOwner, "Only current owner can transfer");
        require(_newOwner != address(0), "Invalid new owner address");
        require(_newOwner != land.currentOwner, "Cannot transfer to yourself");

        address previousOwner = land.currentOwner;
        land.currentOwner = _newOwner;

        ownershipHistory[_landId].push(_newOwner);

        landTransactions[_landId].push(Transaction({
            from: previousOwner,
            to: _newOwner,
            timestamp: block.timestamp,
            txType: "TRANSFER"
        }));

        emit LandTransferred(_landId, previousOwner, _newOwner);
    }

    function getLand(uint _landId) public view landExists(_landId)
        returns (
            uint, string memory, string memory,
            address, string memory, uint
        )
    {
        Land memory l = lands[_landId];
        return (l.landId, l.location, l.area, l.currentOwner, l.documentHash, l.registeredAt);
    }

    function getOwnershipHistory(uint _landId) public view landExists(_landId)
        returns (address[] memory)
    {
        return ownershipHistory[_landId];
    }

    function getLandTransactions(uint _landId) public view landExists(_landId)
        returns (address[] memory froms, address[] memory tos, uint[] memory timestamps, string[] memory txTypes)
    {
        Transaction[] memory txs = landTransactions[_landId];
        froms = new address[](txs.length);
        tos = new address[](txs.length);
        timestamps = new uint[](txs.length);
        txTypes = new string[](txs.length);

        for (uint i = 0; i < txs.length; i++) {
            froms[i] = txs[i].from;
            tos[i] = txs[i].to;
            timestamps[i] = txs[i].timestamp;
            txTypes[i] = txs[i].txType;
        }
    }

    function getAllLandIds() public view returns (uint[] memory) {
        return allLandIds;
    }

    function isAuthority(address _addr) public view returns (bool) {
        return _addr == authority;
    }
}
