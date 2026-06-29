UPDATE transport_orders
SET pickup_address = 'ADRES TESTOWY - DO UZUPEŁNIENIA'
WHERE pickup_address IS NULL
   OR btrim(pickup_address) = '';

UPDATE transport_orders
SET destination_address = 'ADRES TESTOWY - DO UZUPEŁNIENIA'
WHERE destination_address IS NULL
   OR btrim(destination_address) = '';

ALTER TABLE transport_orders
    ALTER COLUMN pickup_address SET NOT NULL;

ALTER TABLE transport_orders
    ALTER COLUMN destination_address SET NOT NULL;