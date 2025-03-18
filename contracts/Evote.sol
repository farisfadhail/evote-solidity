// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract Evote {
    enum Role { None, Admin, Voter }

    struct User {
        string NIM;
        bytes32 passwordHash;
        Role role;
        bool isRegistered;
    }

    address public superAdmin;
    uint256 public votingCount;

    mapping(string => User) public users;
    string[] public votersList;

    struct Voting {
        string title;
        string description;
        string[] candidates;
        string[] imageHash;
        mapping(string => uint256) votes;
        mapping(string => bool) hasVoted;
        uint256 startTime;
        uint256 endTime;
        bool votingEnded;
    }

    string public superAdminNIM = "0000";

    mapping(uint256 => Voting) public votings;

    event UserRegistered(string NIM, Role role, bytes32 txHash, uint256 blockNumber);
    event VotingCreated(uint256 votingId, string title, string description, uint256 startTime, uint256 endTime, bytes32 txHash, uint256 blockNumber);
    event VotingEnded(uint256 votingId, bytes32 txHash, uint256 blockNumber);
    event Voted(string NIM, uint256 votingId, string candidate, bytes32 txHash, uint256 blockNumber);
    event LoginSuccess(string NIM, Role role, bytes32 txHash, uint256 blockNumber);
    event VotingCancelled(uint256 votingId, bytes32 txHash, uint256 blockNumber);

    modifier onlyAdmin() {
        require(users[superAdminNIM].role == Role.Admin, "Only admin can perform this action");
        _;
    }

    modifier onlySuperAdmin() {
        require(msg.sender == superAdmin, "Only super admin can perform this action");
        _;
    }

    modifier votingActive(uint256 votingId) {
        Voting storage currentVoting = votings[votingId];
        require(block.timestamp >= currentVoting.startTime, "Voting has not started yet");
        require(block.timestamp <= currentVoting.endTime, "Voting has already ended");
        require(!currentVoting.votingEnded, "Voting has been marked as ended by admin");
        _;
    }

    constructor() {
        superAdmin = msg.sender;
        users[superAdminNIM] = User({
            NIM: superAdminNIM,
            passwordHash: keccak256(abi.encodePacked("admin", superAdminNIM)),
            role: Role.Admin,
            isRegistered: true
        });
    }

    function registerUser(string memory _NIM, string memory _password, Role _role) external onlySuperAdmin {
        require(!users[_NIM].isRegistered, "User is already registered");
        require(_role == Role.Admin || _role == Role.Voter, "Invalid role");

        bytes32 passwordHash = keccak256(abi.encodePacked(_password, _NIM));

        users[_NIM] = User({
            NIM: _NIM,
            passwordHash: passwordHash,
            role: _role,
            isRegistered: true
        });

        if (_role == Role.Voter) {
            votersList.push(_NIM);
        }

        emit UserRegistered(_NIM, _role, blockhash(block.number - 1), block.number);
    }

    function login(string memory _NIM, string memory _password) external returns (bool) {
        User storage user = users[_NIM];
        require(user.isRegistered, "User not registered");
        require(keccak256(abi.encodePacked(_password, _NIM)) == user.passwordHash, "Invalid credentials");

        emit LoginSuccess(_NIM, user.role, blockhash(block.number - 1), block.number);
        return true;
    }

    function createVoting(string memory _title, string memory _description, string[] memory _candidates, string[] memory _imageHash, uint256 _startTime, uint256 _endTime) external onlyAdmin {
        require(_startTime < _endTime, "Start time must be before end time");
        require(_startTime > block.timestamp, "Start time must be in the future");
        require(_candidates.length > 1, "At least 2 candidates required");
        require(_candidates.length == _imageHash.length, "Candidates and image hashes count mismatch");

        for (uint256 i = 0; i < votingCount; i++) {
            require(
                _startTime >= votings[i].endTime || _endTime <= votings[i].startTime,
                "Voting time overlaps with existing voting"
            );
        }

        Voting storage newVoting = votings[votingCount];
        newVoting.title = _title;
        newVoting.description = _description;
        newVoting.startTime = _startTime;
        newVoting.endTime = _endTime;

        for (uint i = 0; i < _candidates.length; i++) {
            newVoting.candidates.push(_candidates[i]);
            newVoting.imageHash.push(_imageHash[i]);
        }

        votingCount++;
        emit VotingCreated(votingCount - 1, _title, _description, _startTime, _endTime, blockhash(block.number - 1), block.number);
    }

    function vote(string memory _NIM, uint256 votingId, string memory _candidate) external votingActive(votingId) {
        User storage user = users[_NIM];
        require(user.role == Role.Voter, "Only voters can vote");
        require(user.isRegistered, "Not registered to vote");
        require(!votings[votingId].hasVoted[_NIM], "Already voted in this voting");

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
        currentVoting.hasVoted[_NIM] = true;

        emit Voted(_NIM, votingId, _candidate, blockhash(block.number - 1), block.number);
    }

    function endVoting(uint256 votingId) external onlyAdmin {
        Voting storage currentVoting = votings[votingId];
        require(block.timestamp > currentVoting.endTime, "Voting end time has not passed yet");
        require(!currentVoting.votingEnded, "Voting already ended");

        currentVoting.votingEnded = true;
        emit VotingEnded(votingId, blockhash(block.number - 1), block.number);
    }

    function cancelVoting(uint256 votingId) external onlySuperAdmin {
        Voting storage currentVoting = votings[votingId];
        require(!currentVoting.votingEnded, "Voting already ended");

        currentVoting.votingEnded = true;
        emit VotingCancelled(votingId, blockhash(block.number - 1), block.number);
    }

    function getVoteCount(uint256 votingId, string memory _candidate) public view returns (uint256) {
        return votings[votingId].votes[_candidate];
    }

    function getWinner(uint256 votingId) external view returns (string memory winner, uint256 winnerVotes) {
        Voting storage currentVoting = votings[votingId];
        require(currentVoting.votingEnded, "Voting has not ended yet");

        uint256 highestVotes = 0;
        string memory topCandidate = "";
        for (uint256 i = 0; i < currentVoting.candidates.length; i++) {
            uint256 candidateVotes = currentVoting.votes[currentVoting.candidates[i]];
            if (candidateVotes > highestVotes) {
                highestVotes = candidateVotes;
                topCandidate = currentVoting.candidates[i];
            }
        }
        return (topCandidate, highestVotes);
    }

    function getCandidates(uint256 votingId) external view returns (string[] memory, string[] memory) {
        return (votings[votingId].candidates, votings[votingId].imageHash);
    }

    function isRegisteredUser(string memory _NIM) external view returns (bool) {
        return users[_NIM].isRegistered;
    }

    function getUserRole(string memory _NIM) external view returns (Role) {
        return users[_NIM].role;
    }

    function getVoterNIMS() external view returns (string[] memory) {
        return votersList;
    }
}
