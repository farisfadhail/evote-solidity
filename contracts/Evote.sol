// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract Evote {
    enum Role { None, Admin, Voter }

    struct User {
        string NIM;
        Role role;
        bool hasVoted;
        bool isRegistered;
    }

    address public superAdmin;
    uint256 public votingCount;

    mapping(address => User) public users;

    address[] public votersList;

    struct Voting {
        string title;
        string[] candidates;
        mapping(string => uint256) votes;
        bool votingStarted;
        bool votingEnded;
    }

    mapping(uint256 => Voting) public votings;

    event UserRegistered(address userAddress, string NIM, Role role);
    event VotingCreated(uint256 votingId, string title);
    event VotingStarted(uint256 votingId);
    event VotingEnded(uint256 votingId);
    event Voted(address voterAddress, uint256 votingId, string candidate);
    event LoginSuccess(address userAddress, string NIM, Role role);

    modifier onlyAdmin() {
        require(users[msg.sender].role == Role.Admin, "Only admin can perform this action");
        _;
    }

    modifier onlySuperAdmin() {
        require(msg.sender == superAdmin, "Only super admin can perform this action");
        _;
    }

    modifier votingActive(uint256 votingId) {
        require(votings[votingId].votingStarted, "Voting has not started yet");
        require(!votings[votingId].votingEnded, "Voting has already ended");
        _;
    }

    constructor() {
        superAdmin = msg.sender;
        users[msg.sender] = User({
            NIM: "0000",
            role: Role.Admin,
            hasVoted: false,
            isRegistered: true
        });
    }

    function registerUser(address _userAddress, string memory _NIM, Role _role) external onlySuperAdmin {
        require(!users[_userAddress].isRegistered, "User is already registered");
        require(_role == Role.Admin || _role == Role.Voter, "Invalid role");

        users[_userAddress] = User({
            NIM: _NIM,
            role: _role,
            hasVoted: false,
            isRegistered: true
        });


        if (_role == Role.Voter) {
            votersList.push(_userAddress);
        }

        emit UserRegistered(_userAddress, _NIM, _role);
    }

    function createVoting(string memory _title, string[] memory _candidates) external onlyAdmin {
        Voting storage newVoting = votings[votingCount];
        newVoting.title = _title;
        for (uint i = 0; i < _candidates.length; i++) {
            newVoting.candidates.push(_candidates[i]);
        }
        votingCount++;
        emit VotingCreated(votingCount - 1, _title);
    }

    function startVoting(uint256 votingId) external onlyAdmin {
        require(!votings[votingId].votingStarted, "Voting is already started");
        votings[votingId].votingStarted = true;
        emit VotingStarted(votingId);
    }

    function endVoting(uint256 votingId) external onlyAdmin {
        require(votings[votingId].votingStarted, "Voting has not started yet");
        require(!votings[votingId].votingEnded, "Voting has already ended");
        votings[votingId].votingEnded = true;
        emit VotingEnded(votingId);
    }

    function vote(uint256 votingId, string memory _candidate) external votingActive(votingId) {
        User storage user = users[msg.sender];
        require(user.role == Role.Voter, "Only voters can vote");
        require(user.isRegistered, "You are not registered to vote");
        require(!user.hasVoted, "You have already voted");


        bool validCandidate = false;
        Voting storage currentVoting = votings[votingId];
        for (uint i = 0; i < currentVoting.candidates.length; i++) {
            if (keccak256(abi.encodePacked(currentVoting.candidates[i])) == keccak256(abi.encodePacked(_candidate))) {
                validCandidate = true;
                break;
            }
        }
        require(validCandidate, "Invalid candidate");


        currentVoting.votes[_candidate] += 1;
        user.hasVoted = true;

        emit Voted(msg.sender, votingId, _candidate);
    }

    function getResults(uint256 votingId, string memory _candidate) external view returns (uint256) {
        require(votings[votingId].votingEnded, "Voting has not ended yet");
        return votings[votingId].votes[_candidate];
    }

    function getCandidateCount(uint256 votingId) external view returns (uint256) {
        return votings[votingId].candidates.length;
    }

    function getCandidate(uint256 votingId, uint256 index) external view returns (string memory) {
        require(index < votings[votingId].candidates.length, "Invalid index");
        return votings[votingId].candidates[index];
    }

    function isRegisteredUser(address _userAddress) external view returns (bool) {
        return users[_userAddress].isRegistered;
    }

    function getUserRole(address _userAddress) external view returns (Role) {
        return users[_userAddress].role;
    }

    function getVoterAddresses() external view returns (address[] memory) {
        return votersList;
    }

    function login(string memory _NIM) external returns (bool) {
        User storage user = users[msg.sender];
        require(user.isRegistered, "User not registered");
        require(keccak256(abi.encodePacked(user.NIM)) == keccak256(abi.encodePacked(_NIM)), "Invalid NIM");


        emit LoginSuccess(msg.sender, user.NIM, user.role);
        return true;
    }
}
