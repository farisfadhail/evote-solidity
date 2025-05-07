// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract Evote {
    enum Role { None, Admin, Voter }

    struct User {
        bytes32 passwordHash;
        Role role;
        bool isRegistered;
    }

    struct Candidate {
        string number;
        string name;
        string imageHash;
        string vision;
        string mission;
    }

    struct Voting {
        string title;
        string description;
        uint40 startTime;
        uint40 endTime;
        bool votingEnded;
    }

    mapping(string => User) public users;
    string[] public votersList;

    Voting public voting;
    mapping(bytes32 => Candidate) public candidates;
    bytes32[] public candidateIds;

    mapping(bytes32 => uint256) public votingVotes;
    mapping(bytes32 => bool) public hasVoted;
    mapping(bytes32 => bytes32) public votingHistory;

    event UserRegistered(string indexed NIM, Role role);
    event VotingCreated(string title, string description, uint40 startTime, uint40 endTime);
    event VotingUpdated(string title, string description, uint40 startTime, uint40 endTime);
    event VotingEnded();

    event CandidateAdded(bytes32 indexed candidateId, string name);
    event CandidateUpdated(bytes32 indexed candidateId, string name);
    event CandidateDeleted(bytes32 indexed candidateId);
    event Voted(bytes32 indexed voterHash, bytes32 indexed candidateId);

    modifier votingActive() {
        require(block.timestamp >= voting.startTime, "Voting belum dimulai");
        require(block.timestamp <= voting.endTime, "Voting telah berakhir");
        require(!voting.votingEnded, "Voting telah ditandai selesai");
        _;
    }

    function registerUser(string calldata _NIM, bytes32 _password, Role _role) external returns (bool) {
        require(!users[_NIM].isRegistered, "User sudah terdaftar");
        require(_role == Role.Admin || _role == Role.Voter, "Role tidak valid");

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

    function createVoting(string calldata _title, string calldata _description, uint40 _startTime, uint40 _endTime) external {
        require(_startTime < _endTime, "Start time harus sebelum end time");
        require(_startTime > block.timestamp, "Start time harus di masa depan");
        require(_endTime - _startTime >= 3600, "Durasi minimal 1 jam");

        delete candidateIds;

        voting = Voting({
            title: _title,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            votingEnded: false
        });

        emit VotingCreated(_title, _description, _startTime, _endTime);
    }

    function updateVoting(string calldata _title, string calldata _description, uint40 _startTime, uint40 _endTime) external {
        require(block.timestamp < voting.startTime, "Voting sudah dimulai");

        voting.title = _title;
        voting.description = _description;
        voting.startTime = _startTime;
        voting.endTime = _endTime;

        emit VotingUpdated(_title, _description, _startTime, _endTime);
    }

    function deleteVoting() external {
        require(block.timestamp < voting.startTime || voting.startTime == 0, "Voting sudah dimulai");

        voting.title = "";
        voting.description = "";
        voting.startTime = 0;
        voting.endTime = 0;
        voting.votingEnded = false;
    }

    function addCandidate(bytes32 candidateId, string calldata number, string calldata name, string calldata imageHash, string calldata vision, string calldata mission) external {
        require(voting.startTime == 0 || block.timestamp < voting.startTime, "Voting sudah dimulai");
        require(bytes(candidates[candidateId].name).length == 0, "Kandidat sudah ada");

        candidates[candidateId] = Candidate(number, name, imageHash, vision, mission);
        candidateIds.push(candidateId);

        emit CandidateAdded(candidateId, name);
    }

    function updateCandidate(bytes32 candidateId, string calldata number, string calldata name, string calldata imageHash, string calldata vision, string calldata mission) external {
        require(bytes(candidates[candidateId].name).length != 0, "Kandidat tidak ditemukan");

        Candidate storage c = candidates[candidateId];
        c.number = number;
        c.name = name;
        c.imageHash = imageHash;
        c.vision = vision;
        c.mission = mission;

        emit CandidateUpdated(candidateId, name);
    }

    function deleteCandidate(bytes32 candidateId) external {
        require(voting.startTime == 0 || block.timestamp < voting.startTime, "Voting sudah dimulai");
        require(bytes(candidates[candidateId].name).length != 0, "Kandidat tidak ditemukan");

        delete candidates[candidateId];

        for (uint256 i = 0; i < candidateIds.length; i++) {
            if (candidateIds[i] == candidateId) {
                candidateIds[i] = candidateIds[candidateIds.length - 1];
                candidateIds.pop();
                break;
            }
        }

        emit CandidateDeleted(candidateId);
    }

    function getAllCandidate() external view returns (
        bytes32[] memory ids,
        string[] memory numbers,
        string[] memory names,
        string[] memory imageHashes,
        string[] memory visions,
        string[] memory missions
    ) {
        uint256 count = candidateIds.length;
        ids = new bytes32[](count);
        numbers = new string[](count);
        names = new string[](count);
        imageHashes = new string[](count);
        visions = new string[](count);
        missions = new string[](count);

        for (uint256 i = 0; i < count; i++) {
            bytes32 id = candidateIds[i];
            Candidate storage c = candidates[id];
            ids[i] = id;
            numbers[i] = c.number;
            names[i] = c.name;
            imageHashes[i] = c.imageHash;
            visions[i] = c.vision;
            missions[i] = c.mission;
        }
    }

    function vote(bytes32 voterHash, bytes32 candidateId) external votingActive {
        require(!hasVoted[voterHash], "Sudah memilih");

        votingVotes[candidateId]++;
        hasVoted[voterHash] = true;
        votingHistory[voterHash] = candidateId;

        emit Voted(voterHash, candidateId);
    }

    function endVoting() external {
        require(block.timestamp > voting.endTime, "Waktu voting belum selesai");
        require(!voting.votingEnded, "Voting sudah ditutup");

        voting.votingEnded = true;
        emit VotingEnded();
    }

    function getVotingResult() external view returns (
        bytes32[] memory ids,
        string[] memory numbers,
        string[] memory names,
        string[] memory imageHashes,
        string[] memory visions,
        string[] memory missions,
        uint256[] memory votes
    ) {
        uint256 count = candidateIds.length;
        ids = new bytes32[](count);
        numbers = new string[](count);
        names = new string[](count);
        imageHashes = new string[](count);
        visions = new string[](count);
        missions = new string[](count);
        votes = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            bytes32 id = candidateIds[i];
            Candidate storage c = candidates[id];
            ids[i] = id;
            numbers[i] = c.name;
            names[i] = c.name;
            imageHashes[i] = c.imageHash;
            visions[i] = c.vision;
            missions[i] = c.mission;
            votes[i] = votingVotes[id];
        }
    }


    function getVotingDetails() external view returns (
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        bool votingEnded
    ) {
        return (
            voting.title,
            voting.description,
            voting.startTime,
            voting.endTime,
            voting.votingEnded
        );
    }

    function getVoterNIMS() external view returns (string[] memory) {
        return votersList;
    }

    function getAllVotingHistory() external view returns (
        bytes32[] memory voterHashes,
        bytes32[] memory candidateIdsVoted
    ) {
        uint256 count = votersList.length;
        voterHashes = new bytes32[](count);
        candidateIdsVoted = new bytes32[](count);

        for (uint256 i = 0; i < count; i++) {
            voterHashes[i] = keccak256(abi.encodePacked(votersList[i]));
            candidateIdsVoted[i] = votingHistory[voterHashes[i]];
        }
    }
}
