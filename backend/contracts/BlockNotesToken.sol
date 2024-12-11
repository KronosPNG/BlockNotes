// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/// @title BlockNotesToken - Token ERC-20 per la piattaforma
contract BlockNotesToken is ERC20, Ownable(msg.sender) {
    constructor() ERC20("BlockNotesToken", "BNT") {}

    /// @notice Conia nuovi token
    /// @param recipient Indirizzo del destinatario
    /// @param amount Quantità di token da coniare
    function mint(address recipient, uint256 amount) external onlyOwner {
        _mint(recipient, amount);
    }
}

/// @title NoteExchange - Sistema per lo scambio di appunti
contract NoteExchange is Ownable(msg.sender) {
    struct Note {
        uint256 id;
        address uploader;
        string title;
        uint256 price;
        string encryptedCID; // CID cifrato con public key venditore
        bytes32 fileHash; // hash sha3 del file
    }

    struct Payment {
        uint256 idNote;
        address buyer;
        uint256 amount;
        bool active;
        string reEncryptedCID; // proxy re-encryption
    }

    BlockNotesToken public token;
    uint256 public nextNoteId = 1;
    mapping(uint256 => Note) public notes;
    mapping(bytes32 => Payment) public payments; // hash(id_note+buyer_address) -> payment

    event NoteUploaded(uint256 id, address uploader, bytes32 fileHash, string encryptedCID, string title, uint256 price);
    event InitPayment(uint256 noteId, address buyer, uint256 amount);
    event CidDelivered(uint256 noteId, address uploader, address buyer, string reEncryptedCID);
    event FinalizePayment(uint256 noteId, address uploader, address buyer, string reEncryptedCID);

    constructor(address tokenAddress) {
        token = BlockNotesToken(tokenAddress);
    }

    uint256 public constant BASE_REWARD = 100 * (10 ** 18); // Ricompensa iniziale

    /// @notice Carica un nuovo appunto su IPFS e guadagna token
    /// @param fileHash Hash del file su IPFS
    /// @param title Descrizione degli appunti
    /// @param price Prezzo dell'appunto
    function uploadNote(bytes32 fileHash, string memory encryptedCID, string memory title, uint256 price) external {
        // Registra l'appunto
        notes[nextNoteId] = Note({
            id: nextNoteId,
            uploader: msg.sender,
            fileHash: fileHash,
            encryptedCID: encryptedCID,
            title: title,
            price: price
        });

        // Calcolo della ricompensa decrescente
        uint256 reward = BASE_REWARD / Math.sqrt(nextNoteId);
        // Conia token per incentivare l'upload
        token.mint(msg.sender, reward);

        emit NoteUploaded(nextNoteId, msg.sender, fileHash, encryptedCID, title, price);
        nextNoteId++;
    }

    /// @notice Genera la chiave hash per il mapping dei pagamenti
    /// @param id Un identificatore uint256
    /// @param buyer Indirizzo dell'utente
    /// @return La chiave hash
    function generateKey(uint256 id, address buyer) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(id, buyer));
    }

    /// @notice Blocca i token necessari per l'acquisto
    /// @param noteId ID dell'appunto da acquistare
    function initiatePurchase(uint256 noteId) external {
        // Verifica che l'appunto esista
        require(noteId > 0 && noteId < nextNoteId, "ID dell'appunto non valido");
        Note storage note = notes[noteId];

        // Non puoi acquistare i tuoi appunti
        require(note.uploader != msg.sender, "Sei il venditore dell'appunto");
        // Verifica che l'acquirente abbia abbastanza token
        require(token.balanceOf(msg.sender) >= note.price, "Saldo insufficiente");

        // Blocca i token nello smart contract
        token.transferFrom(msg.sender, address(this), note.price);

        // Registra il payment
        bytes32 payId = generateKey(noteId, msg.sender);
        payments[payId] = Payment({
            idNote: noteId,
            buyer: msg.sender,
            amount: note.price,
            reEncryptedCID: "",
            active: true
        });

        emit InitPayment(noteId, msg.sender, note.price);
    }

    /// @notice Completa l'acquisto e rilascia i token
    /// @param noteId ID dell'appunto acquistato
    /// @param buyer Indirizzo dell'acquirente
    /// @param reEncryptedCID CID cifrato dell'appunto
    function deliverCID(uint256 noteId, address buyer, string memory reEncryptedCID) external {
        Payment storage payment = payments[generateKey(noteId, buyer)];
        require(payment.active, "Il pagamento non esiste oppure gia' e' stato completato");
        
        Note storage note = notes[noteId];
        require(note.uploader == msg.sender, "Non sei il venditore dell'appunto");

        // Setta il CID cifrato
        payment.reEncryptedCID = reEncryptedCID;

        // Trasferisce i token al venditore
        token.transfer(note.uploader, payment.amount);

        emit CidDelivered(noteId, note.uploader, buyer, reEncryptedCID);
    }

    /// @notice Completa l'acquisto e ottieni il CID
    /// @param noteId ID dell'appunto acquistato
    function finalizePayment(uint256 noteId) external {
        Payment storage payment = payments[generateKey(noteId, msg.sender)];
        require(payment.active, "Il pagamento non esiste oppure gia' e' stato completato");
        
        // Verifica che il CID sia stato fornito
        require(bytes(payment.reEncryptedCID).length > 0 , "Il CID ancora non e' stato fornito");
        
        Note storage note = notes[noteId];
        require(payment.buyer == msg.sender, "Non sei l'acquirente");

        // Disattiva il payment
        payment.active = false;

        emit FinalizePayment(noteId, note.uploader, payment.buyer, payment.reEncryptedCID);
    }
}
