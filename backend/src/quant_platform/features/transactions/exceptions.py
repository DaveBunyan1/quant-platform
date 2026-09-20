from uuid import UUID


class TransactionNotFound(Exception):
    def __init__(self, transaction_id: UUID):
        self.transaction_id = transaction_id
        super().__init__(f"Transaction {transaction_id} was not found")
