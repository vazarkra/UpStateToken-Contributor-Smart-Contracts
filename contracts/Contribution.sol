pragma solidity >=0.6.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/** @title Contract to receive ETH deposits and issue ERC20 Tokens.
    @author Ravi.
    @dev Contract assumes a rate ratio of 1:1 for ETH:ERC20 tokens for simplicity of calculations 
    we also assume that the owner of the initial supply will have given an allowance to this conttract
    to spend/issue all the tokens.*/
contract Contribution {
/// State variables
    uint public rate; //Rate ratio ETH:ERC20 token
    IERC20 public token; //Reference to the deployed ERC20 token that this contract will issue
    mapping(address=>uint) public contributors; //Mapping to store contributor addresses and their ETH contributions
    address private tokenOwner; //Owner account which owns entire initial supply of ERC20 tokens

/** @dev Constructor function to initialize state variables.
    @param _rate ratio of ETH:ERC20 token.
    @param _token Reference to the ERC20 token to be issued by this contract.
    @param owner Owner account (Owns entire initial supply) for ERC20 token. */

    constructor(uint _rate, IERC20 _token, address owner) public {
    ///Ensure supplied rate is not zero
        require(_rate > 0, "Rate cannot be 0");
    ///Initialize state variables
        rate = _rate;
        token = _token;
        tokenOwner = owner;
    }

/** @dev Event ethReceived is emitted on receipt of ETH into the contract
    and Event tokenIssued is emitted on issuing the ERC20 tokens to ETH depositor. */
    event ethReceived(address indexed from, uint amount);
    event tokensIssued(address indexed to, uint amount);

/** @dev This function issues the ERC20 token to the ETH depositor by
    calling the transferFrom function of the ERC20 contract.
    @param amount amount of ERC20 tokens to be issued. */

    function issueTokens(uint amount) internal {
        token.transferFrom(tokenOwner, msg.sender, amount);
    }

/** @dev This function returns the ETH deposited to this contract by an account address.
    @param buyer wallet address of the ETH depositor. 
    @return uint amount of ETH contributed so far. */

    function getContribution(address buyer) public view returns(uint) {
        return contributors[buyer];
    }

/** @dev fallback function called when ETH is sent to this contract. */

    receive() external payable {
    /** Store the depositor address and amount of ETH deposited in the mapping
    we keep track of multiple deposits by the same account by adding the 
    amount and not simply overwriting with latest deposit amount */
        contributors[msg.sender]+= msg.value;
    ///emit ETH received event    
        emit ethReceived(msg.sender, msg.value);
    ///Calling function to issue the ERC20 token    
        issueTokens(msg.value);
    ///emit the token issued event    
        emit tokensIssued(msg.sender, msg.value);
    }

}