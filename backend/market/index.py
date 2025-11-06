"""
Business: Market API for buying and selling Bubas between players
Args: event with httpMethod, body, queryStringParameters; context with request_id
Returns: HTTP response with market data or transaction results
"""

import json
import os
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Get database connection using simple query protocol"""
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            cur.execute("SELECT * FROM market_listings ORDER BY listed_at DESC")
            listings = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'listings': listings}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            user_id = event.get('headers', {}).get('x-user-id') or event.get('headers', {}).get('X-User-Id', 'anonymous')
            
            if action == 'list_on_market':
                inventory_id = body_data.get('inventory_id')
                price = body_data.get('price')
                
                user_id_safe = user_id.replace("'", "''")
                
                cur.execute(f"SELECT * FROM inventory WHERE id = {inventory_id} AND user_id = '{user_id_safe}'")
                item = cur.fetchone()
                
                if not item:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Item not found'}),
                        'isBase64Encoded': False
                    }
                
                booba_type_safe = item['booba_type'].replace("'", "''")
                booba_name_safe = item['booba_name'].replace("'", "''")
                booba_image_safe = item['booba_image'].replace("'", "''")
                booba_rarity_safe = item['booba_rarity'].replace("'", "''")
                
                cur.execute(f"""
                    INSERT INTO market_listings (seller_id, inventory_id, price, booba_type, booba_name, booba_image, booba_rarity)
                    VALUES ('{user_id_safe}', {inventory_id}, {price}, '{booba_type_safe}', '{booba_name_safe}', '{booba_image_safe}', '{booba_rarity_safe}')
                    RETURNING id
                """)
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'buy':
                listing_id = body_data.get('listing_id')
                
                cur.execute(f"SELECT * FROM market_listings WHERE id = {listing_id}")
                listing = cur.fetchone()
                
                if not listing:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Listing not found'}),
                        'isBase64Encoded': False
                    }
                
                if listing['seller_id'] == user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Cannot buy your own listing'}),
                        'isBase64Encoded': False
                    }
                
                user_id_safe = user_id.replace("'", "''")
                seller_id_safe = listing['seller_id'].replace("'", "''")
                
                cur.execute(f"SELECT balance FROM users WHERE user_id = '{user_id_safe}'")
                buyer = cur.fetchone()
                buyer_balance = buyer['balance'] if buyer else 50
                
                if buyer_balance < listing['price']:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Insufficient balance'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"INSERT INTO users (user_id, balance) VALUES ('{user_id_safe}', {buyer_balance - listing['price']}) ON CONFLICT (user_id) DO UPDATE SET balance = {buyer_balance - listing['price']}")
                
                cur.execute(f"SELECT balance FROM users WHERE user_id = '{seller_id_safe}'")
                seller = cur.fetchone()
                seller_balance = seller['balance'] if seller else 50
                cur.execute(f"UPDATE users SET balance = {seller_balance + listing['price']} WHERE user_id = '{seller_id_safe}'")
                
                cur.execute(f"UPDATE inventory SET user_id = '{user_id_safe}' WHERE id = {listing['inventory_id']}")
                
                cur.execute(f"DELETE FROM market_listings WHERE id = {listing_id}")
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            

        
        elif method == 'DELETE':
            query_params = event.get('queryStringParameters', {})
            listing_id = query_params.get('listing_id')
            user_id = event.get('headers', {}).get('x-user-id') or event.get('headers', {}).get('X-User-Id', 'anonymous')
            user_id_safe = user_id.replace("'", "''")
            
            cur.execute(f"SELECT seller_id FROM market_listings WHERE id = {listing_id}")
            listing = cur.fetchone()
            
            if not listing or listing['seller_id'] != user_id:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"DELETE FROM market_listings WHERE id = {listing_id}")
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()