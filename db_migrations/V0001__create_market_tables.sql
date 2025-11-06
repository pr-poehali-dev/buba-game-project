-- Users table to store player inventories
CREATE TABLE users (
    user_id VARCHAR(255) PRIMARY KEY,
    balance INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table to store owned Bubas
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id),
    booba_type VARCHAR(50) NOT NULL,
    booba_name VARCHAR(100) NOT NULL,
    booba_image TEXT NOT NULL,
    booba_rarity VARCHAR(20) NOT NULL,
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Market listings table
CREATE TABLE market_listings (
    id SERIAL PRIMARY KEY,
    seller_id VARCHAR(255) NOT NULL REFERENCES users(user_id),
    inventory_id INTEGER NOT NULL REFERENCES inventory(id),
    price INTEGER NOT NULL,
    booba_type VARCHAR(50) NOT NULL,
    booba_name VARCHAR(100) NOT NULL,
    booba_image TEXT NOT NULL,
    booba_rarity VARCHAR(20) NOT NULL,
    listed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(inventory_id)
);

-- Create indexes for better performance
CREATE INDEX idx_inventory_user ON inventory(user_id);
CREATE INDEX idx_market_seller ON market_listings(seller_id);
CREATE INDEX idx_market_rarity ON market_listings(booba_rarity);
CREATE INDEX idx_market_listed_at ON market_listings(listed_at DESC);