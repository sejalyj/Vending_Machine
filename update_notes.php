<?php
// Connect to MySQL database
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "vending_machine"; // Update with your database name

$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
 
// Read input from frontend
$data = json_decode(file_get_contents('php://input'), true);
$insertedAmount = $data['insertedAmount'] ?? null;
$change = $data['change'] ?? null; // Change array for returning denominations
$cancelAmount = $data['cancelAmount'] ?? null;

// Function to update the notes table
function updateNotes($conn, $denomination, $operation) {
    // Fetch the current count for the denomination
    $sql = "SELECT count FROM notes WHERE denomination = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $denomination);
    $stmt->execute();
    $stmt->bind_result($currentCount);
    
    // Check if the result is available
    if (!$stmt->fetch()) {
        $stmt->close();
        return false; // Denomination not found
    }
    $stmt->close();

    // Update count based on the operation (add or subtract)
    if ($operation === 'add') {
        $newCount = $currentCount + 1;
    } elseif ($operation === 'subtract') {
        if ($currentCount <= 0) {
            return false; // Cannot subtract if there are no notes left
        }
        $newCount = $currentCount - 1;
    } else {
        return false;
    }

    // Update the notes count
    $updateSql = "UPDATE notes SET count = ? WHERE denomination = ?";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bind_param("ii", $newCount, $denomination);
    if ($updateStmt->execute()) {
        $updateStmt->close();
        return true;
    } else {
        $updateStmt->close();
        return false;
    }
}

// Process the inserted amount
if ($insertedAmount !== null) {
    if (updateNotes($conn, $insertedAmount, 'add')) {
        echo json_encode(["success" => true, "message" => "Note added successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Error adding note"]);
    }
}

// Process the change to return
if (!empty($change)) {
    foreach ($change as $denomination => $count) {
        for ($i = 0; $i < $count; $i++) {
            if (!updateNotes($conn, $denomination, 'subtract')) {
                echo json_encode(["success" => false, "message" => "Error returning change for ₹$denomination"]);
                exit;
            }
        }
    }
    echo json_encode(["success" => true, "message" => "Change returned successfully"]);
}

// Process cancel request
if ($cancelAmount !== null) {
    // Return the exact balance to the user
    $denominations = [500, 200, 100, 50, 20, 10, 5];
    foreach ($denominations as $denomination) {
        while ($cancelAmount >= $denomination) {
            if (!updateNotes($conn, $denomination, 'subtract')) {
                echo json_encode(["success" => false, "message" => "Error returning balance"]);
                exit;
            }
            $cancelAmount -= $denomination;
        }
    }
    echo json_encode(["success" => true, "message" => "Transaction canceled and balance returned."]);
}

// Close the connection
$conn->close();
?>