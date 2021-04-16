pragma solidity >=0.6.0;

//Get OpenZeppelin ERC20 contract
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/** @title Contract to create and manage a ERC20 Token.
    @author Ravi */

contract UpStateToken is ERC20 {
///State variables    
    uint public startTime;
    uint public endTime;
    address private tokenMiner;

///Modifier to restrict transfer of tokens to within the start and end time range only
    modifier onlyIfOpen {
        require((block.timestamp >= startTime && block.timestamp <= endTime), "Transaction out of time range");
        _;
    }

/** @dev Constructor function to initialize state variables and create the ERC20 token with specific characteristics
    @param owner wallet adress of the token contract deployer who will own initial supply.
    @param _initialSupply Initial token supply for this ERC20 token.
    @param _startTime time the token transfers and issuances can begin. 
    @param _endTime time the token transfers and issuances stop.*/

    constructor(address owner, uint256 _initialSupply, uint256 _startTime, uint256 _endTime) ERC20("UpStateToken", "UPSI") public {
        ///mint the initial supply for the token
        _mint(msg.sender, _initialSupply);
        //set the decimals to 18
        _setupDecimals(18);
        startTime = _startTime;
        endTime = _endTime;
        tokenMiner = owner;

    }

/** @dev This function transfers the tokens between accounts and its overridden to include the time restriction on transfers.
    @param recipient wallet address of the recipient to whom the tokens will be transferred .
    @param amount amount of ERC20 tokens to be transferred. */

    function transfer(address recipient, uint256 amount) public override onlyIfOpen returns (bool) {
        ///Call the internal transfer function of the ERC20 parent contract
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

/** @dev This function is used to issue ERC20 tokens from the token owners account using the allowance that has been given 
    to the issuer contract. Its overridden to include the time restriction on transfers.
    @param sender wallet address of the Initial supply owner
    @param recipient wallet address of the ETH depositor who will receive the ERC20 tokens in return .
    @param amount amount of ERC20 tokens to be issued. */

    function transferFrom(address sender, address recipient, uint256 amount) public override onlyIfOpen returns (bool) {
        ///check that the issuer contract has enough allowance
        require(allowance(tokenMiner, msg.sender) >= amount, "Not enough UPSI tokens available");
        ///Call the internal transfer function of the ERC20 parent contract
        _transfer(sender, recipient, amount);
        return true;
    }
}