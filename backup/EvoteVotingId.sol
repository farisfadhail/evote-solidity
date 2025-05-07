// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract EvoteVotingId {
    enum Role { None, Admin, Voter }

    struct User {
        bytes32 passwordHash;
        Role role;
        bool isRegistered;
    }

    struct Voting {
        string title;
        string description;
        string[] candidates;
        string[] imageHash;
        uint40 startTime;
        uint40 endTime;
        bool votingEnded;
    }

    uint256 public votingCount;

    mapping(string => User) public users;
    string[] public votersList;

    mapping(uint256 => Voting) public votings;
    mapping(uint256 => mapping(bytes32 => uint256)) public votingVotes;
    mapping(uint256 => mapping(string => bool)) public votingHasVoted;

    event UserRegistered(string indexed NIM, Role role);
    event VotingCreated(uint256 indexed votingId, string title, string description, uint40 startTime, uint40 endTime);
    event Voted(string indexed NIM, uint256 indexed votingId, bytes32 candidate);
    event VotingEnded(uint256 indexed votingId);
    event VotingCancelled(uint256 indexed votingId);

    modifier votingActive(uint256 votingId) {
        Voting storage currentVoting = votings[votingId];
        require(block.timestamp >= currentVoting.startTime, "Voting has not started yet");
        require(block.timestamp <= currentVoting.endTime, "Voting has already ended");
        require(!currentVoting.votingEnded, "Voting has been marked as ended by admin");
        _;
    }

    function registerUser(string calldata _NIM, bytes32 _password, Role _role) external returns (bool) {
        require(!users[_NIM].isRegistered, "User is already registered");
        require(_role == Role.Admin || _role == Role.Voter, "Invalid role");

        users[_NIM] = User({
            passwordHash: _password,
            role: _role,
            isRegistered: true
        });

        if (_role == Role.Voter) {
            votersList.push(_NIM);
        }

        emit UserRegistered(_NIM, _role);
        return true;
    }

    function login(string calldata _NIM, bytes32 _password) external view returns (bool, Role) {
        User storage user = users[_NIM];
        if (!user.isRegistered) return (false, Role.None);
        return (_password == user.passwordHash, user.role);
    }

    function createVoting(
        string calldata _title,
        string calldata _description,
        string[] calldata _candidates,
        string[] calldata _imageHash,
        uint40 _startTime,
        uint40 _endTime
    ) external {
        require(_startTime < _endTime, "Start time must be before end time");
        require(_startTime > block.timestamp, "Start time must be in the future");
        require(_endTime - _startTime >= 3600, "Voting duration must be at least 1 hour");
        require(_candidates.length > 1, "At least 2 candidates required");
        require(_candidates.length == _imageHash.length, "Candidates and image hashes count mismatch");

        for (uint256 i = 0; i < votingCount; i++) {
            require(
                _startTime >= votings[i].endTime || _endTime <= votings[i].startTime,
                "Voting time overlaps with existing voting"
            );
        }

        uint256 newVotingId = votingCount++;
        Voting storage newVoting = votings[newVotingId];
        newVoting.title = _title;
        newVoting.description = _description;
        newVoting.startTime = _startTime;
        newVoting.endTime = _endTime;
        newVoting.candidates = _candidates;
        newVoting.imageHash = _imageHash;

        emit VotingCreated(newVotingId, _title, _description, _startTime, _endTime);
    }

    function updateVoting(
        uint256 votingId,
        string calldata _title,
        string calldata _description,
        string[] calldata _candidates,
        string[] calldata _imageHash,
        uint40 _startTime,
        uint40 _endTime
    ) external {
        Voting storage currentVoting = votings[votingId];

        require(block.timestamp < currentVoting.startTime, "Cannot update voting that has started");
        require(_startTime < _endTime, "Start time must be before end time");
        require(_startTime > block.timestamp, "Start time must be in the future");
        require(_endTime - _startTime >= 3600, "Voting duration must be at least 1 hour");
        require(_candidates.length > 1, "At least 2 candidates required");
        require(_candidates.length == _imageHash.length, "Candidates and image hashes count mismatch");

        currentVoting.title = _title;
        currentVoting.description = _description;
        currentVoting.startTime = _startTime;
        currentVoting.endTime = _endTime;
        currentVoting.candidates = _candidates;
        currentVoting.imageHash = _imageHash;

        emit VotingCreated(votingId, _title, _description, _startTime, _endTime);
    }

    function deleteVoting(uint256 votingId) external {
        Voting storage currentVoting = votings[votingId];
        require(block.timestamp < currentVoting.startTime, "Cannot delete voting that has started");

        delete votings[votingId];
        emit VotingCancelled(votingId);
    }

    function vote(uint256 votingId, string calldata _NIM, bytes32 candidate) external votingActive(votingId) {
        require(users[_NIM].isRegistered, "User not registered");
        require(!votingHasVoted[votingId][_NIM], "Already voted");

        votingVotes[votingId][candidate]++;
        votingHasVoted[votingId][_NIM] = true;

        emit Voted(_NIM, votingId, candidate);
    }

    function endVoting(uint256 votingId) external {
        Voting storage currentVoting = votings[votingId];
        require(block.timestamp > currentVoting.endTime, "Voting end time has not passed yet");
        require(!currentVoting.votingEnded, "Voting already ended");

        currentVoting.votingEnded = true;
        emit VotingEnded(votingId);
    }

    function getVotingResult(uint256 votingId) external view returns (
        string[] memory candidates,
        string[] memory imageHash,
        uint256[] memory votes
    ) {
        Voting storage currentVoting = votings[votingId];
        uint256 candidateCount = currentVoting.candidates.length;

        candidates = currentVoting.candidates;
        imageHash = currentVoting.imageHash;
        votes = new uint256[](candidateCount);

        for (uint256 i = 0; i < candidateCount; i++) {
            votes[i] = votingVotes[votingId][keccak256(abi.encodePacked(candidates[i]))];
        }

        return (candidates, imageHash, votes);
    }

    function getCandidates(uint256 votingId) external view returns (string[] memory, string[] memory) {
        Voting storage v = votings[votingId];
        return (v.candidates, v.imageHash);
    }

    function isRegisteredUser(string calldata _NIM) external view returns (bool) {
        return users[_NIM].isRegistered;
    }

    function getVoterNIMS() external view returns (string[] memory) {
        return votersList;
    }

    function getVotingDetails(uint256 votingId) external view returns (
        string memory title,
        string memory description,
        string[] memory candidates,
        string[] memory imageHash,
        uint256 startTime,
        uint256 endTime,
        bool votingEnded
    ) {
        Voting storage v = votings[votingId];
        return (v.title, v.description, v.candidates, v.imageHash, v.startTime, v.endTime, v.votingEnded);
    }

    function getAllVotings() external view returns (
        string[] memory titles,
        uint256[] memory startTimes,
        uint256[] memory endTimes,
        bool[] memory votingEndedStatus
    ) {
        titles = new string[](votingCount);
        startTimes = new uint256[](votingCount);
        endTimes = new uint256[](votingCount);
        votingEndedStatus = new bool[](votingCount);

        for (uint256 i = 0; i < votingCount; i++) {
            Voting storage v = votings[i];
            titles[i] = v.title;
            startTimes[i] = v.startTime;
            endTimes[i] = v.endTime;
            votingEndedStatus[i] = v.votingEnded;
        }

        return (titles, startTimes, endTimes, votingEndedStatus);
    }
}