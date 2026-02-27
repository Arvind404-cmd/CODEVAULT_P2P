// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CodeVault Marketplace
 * @dev A decentralized marketplace for digital assets with IPFS integration
 * @notice This contract manages file ownership, purchases, and access control
 */
contract Marketplace {
    // ============ Structs ============
    struct File {
        uint256 id;
        string cid;           // IPFS Content Identifier
        string title;
        string description;
        string previewImage;  // IPFS CID for preview
        uint256 price;        // Price in wei
        address payable seller;
        uint256 totalSales;
        bool isActive;
        uint256 createdAt;
    }

    struct Purchase {
        uint256 fileId;
        address buyer;
        uint256 purchaseTime;
        uint256 pricePaid;
    }

    // ============ State Variables ============
    uint256 public fileCount;
    uint256 public platformFee = 250; // 2.5% (basis points)
    address payable public owner;
    
    mapping(uint256 => File) public files;
    mapping(address => uint256[]) public userPurchases;
    mapping(address => uint256[]) public userListings;
    mapping(uint256 => mapping(address => bool)) public hasAccess;
    
    Purchase[] public allPurchases;

    // ============ Events ============
    event FileUploaded(
        uint256 indexed id,
        string cid,
        string title,
        uint256 price,
        address indexed seller
    );

    event FilePurchased(
        uint256 indexed id,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );

    event FileDeactivated(uint256 indexed id, address indexed seller);
    event FileReactivated(uint256 indexed id, address indexed seller);
    event PriceUpdated(uint256 indexed id, uint256 oldPrice, uint256 newPrice);

    // ============ Modifiers ============
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier fileExists(uint256 _id) {
        require(_id > 0 && _id <= fileCount, "File does not exist");
        _;
    }

    modifier onlySeller(uint256 _id) {
        require(files[_id].seller == msg.sender, "Only seller can modify");
        _;
    }

    // ============ Constructor ============
    constructor() {
        owner = payable(msg.sender);
    }

    // ============ Core Functions ============

    /**
     * @dev Upload a new file to the marketplace
     * @param _cid IPFS Content Identifier
     * @param _title Title of the file
     * @param _description Description of the file
     * @param _previewImage IPFS CID for preview image
     * @param _price Price in wei
     */
    function uploadFile(
        string memory _cid,
        string memory _title,
        string memory _description,
        string memory _previewImage,
        uint256 _price
    ) external returns (uint256) {
        require(bytes(_cid).length > 0, "CID cannot be empty");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_price > 0, "Price must be greater than 0");

        fileCount++;
        
        files[fileCount] = File({
            id: fileCount,
            cid: _cid,
            title: _title,
            description: _description,
            previewImage: _previewImage,
            price: _price,
            seller: payable(msg.sender),
            totalSales: 0,
            isActive: true,
            createdAt: block.timestamp
        });

        userListings[msg.sender].push(fileCount);
        
        // Seller automatically has access to their own file
        hasAccess[fileCount][msg.sender] = true;

        emit FileUploaded(fileCount, _cid, _title, _price, msg.sender);
        
        return fileCount;
    }

    /**
     * @dev Purchase a file from the marketplace
     * @param _id File ID to purchase
     */
    function purchaseFile(uint256 _id) external payable fileExists(_id) {
        File storage file = files[_id];
        
        require(file.isActive, "File is not active");
        require(msg.sender != file.seller, "Cannot buy your own file");
        require(!hasAccess[_id][msg.sender], "Already purchased");
        require(msg.value >= file.price, "Insufficient payment");

        // Calculate platform fee
        uint256 fee = (file.price * platformFee) / 10000;
        uint256 sellerAmount = file.price - fee;

        // Transfer funds
        file.seller.transfer(sellerAmount);
        owner.transfer(fee);

        // Refund excess payment
        if (msg.value > file.price) {
            payable(msg.sender).transfer(msg.value - file.price);
        }

        // Grant access
        hasAccess[_id][msg.sender] = true;
        userPurchases[msg.sender].push(_id);
        file.totalSales++;

        // Record purchase
        allPurchases.push(Purchase({
            fileId: _id,
            buyer: msg.sender,
            purchaseTime: block.timestamp,
            pricePaid: file.price
        }));

        emit FilePurchased(_id, msg.sender, file.seller, file.price);
    }

    /**
     * @dev Check if user has access to download a file
     * @param _id File ID
     * @param _user User address
     */
    function checkAccess(uint256 _id, address _user) 
        external 
        view 
        fileExists(_id) 
        returns (bool) 
    {
        return hasAccess[_id][_user];
    }

    /**
     * @dev Get the CID of a file (only if user has access)
     * @param _id File ID
     */
    function getFileCID(uint256 _id) 
        external 
        view 
        fileExists(_id) 
        returns (string memory) 
    {
        require(hasAccess[_id][msg.sender], "No access to this file");
        return files[_id].cid;
    }

    /**
     * @dev Get file details (public info only)
     * @param _id File ID
     */
    function getFile(uint256 _id) 
        external 
        view 
        fileExists(_id) 
        returns (
            uint256 id,
            string memory title,
            string memory description,
            string memory previewImage,
            uint256 price,
            address seller,
            uint256 totalSales,
            bool isActive
        ) 
    {
        File storage file = files[_id];
        return (
            file.id,
            file.title,
            file.description,
            file.previewImage,
            file.price,
            file.seller,
            file.totalSales,
            file.isActive
        );
    }

    /**
     * @dev Get all active files for marketplace listing
     */
    function getAllActiveFiles() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // Count active files
        for (uint256 i = 1; i <= fileCount; i++) {
            if (files[i].isActive) {
                activeCount++;
            }
        }
        
        // Collect active file IDs
        uint256[] memory activeFiles = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= fileCount; i++) {
            if (files[i].isActive) {
                activeFiles[index] = i;
                index++;
            }
        }
        
        return activeFiles;
    }

    /**
     * @dev Get user's purchased files
     * @param _user User address
     */
    function getUserPurchases(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userPurchases[_user];
    }

    /**
     * @dev Get user's listed files
     * @param _user User address
     */
    function getUserListings(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userListings[_user];
    }

    // ============ Seller Functions ============

    /**
     * @dev Update file price
     * @param _id File ID
     * @param _newPrice New price in wei
     */
    function updatePrice(uint256 _id, uint256 _newPrice) 
        external 
        fileExists(_id) 
        onlySeller(_id) 
    {
        require(_newPrice > 0, "Price must be greater than 0");
        uint256 oldPrice = files[_id].price;
        files[_id].price = _newPrice;
        emit PriceUpdated(_id, oldPrice, _newPrice);
    }

    /**
     * @dev Deactivate a file listing
     * @param _id File ID
     */
    function deactivateFile(uint256 _id) 
        external 
        fileExists(_id) 
        onlySeller(_id) 
    {
        files[_id].isActive = false;
        emit FileDeactivated(_id, msg.sender);
    }

    /**
     * @dev Reactivate a file listing
     * @param _id File ID
     */
    function reactivateFile(uint256 _id) 
        external 
        fileExists(_id) 
        onlySeller(_id) 
    {
        files[_id].isActive = true;
        emit FileReactivated(_id, msg.sender);
    }

    // ============ Admin Functions ============

    /**
     * @dev Update platform fee (owner only)
     * @param _newFee New fee in basis points (100 = 1%)
     */
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee cannot exceed 10%");
        platformFee = _newFee;
    }

    /**
     * @dev Withdraw accumulated platform fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        owner.transfer(balance);
    }

    /**
     * @dev Get total platform stats
     */
    function getPlatformStats() 
        external 
        view 
        returns (
            uint256 totalFiles,
            uint256 totalPurchases,
            uint256 contractBalance
        ) 
    {
        return (fileCount, allPurchases.length, address(this).balance);
    }
}
