"""
Business: User inventory API to manage owned Bubas
Args: event with httpMethod, headers; context with request_id
Returns: HTTP response with user inventory and balance
"""

import json
import os
from typing import Dict, Any
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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    user_id = event.get('headers', {}).get('x-user-id') or event.get('headers', {}).get('X-User-Id', 'anonymous')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            cur.execute(f"SELECT * FROM inventory WHERE user_id = '{user_id}' ORDER BY acquired_at DESC")
            inventory = cur.fetchall()
            
            cur.execute(f"SELECT balance FROM users WHERE user_id = '{user_id}'")
            user = cur.fetchone()
            balance = user['balance'] if user else 50
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'inventory': inventory, 'balance': balance}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'add':
                booba = body_data.get('booba')
                
                cur.execute(f"INSERT INTO users (user_id) VALUES ('{user_id}') ON CONFLICT (user_id) DO NOTHING")
                
                cur.execute(f"""
                    INSERT INTO inventory (user_id, booba_type, booba_name, booba_image, booba_rarity)
                    VALUES ('{user_id}', '{booba['type']}', '{booba['name']}', '{booba['image']}', '{booba['rarity']}')
                    RETURNING id
                """)
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'inventory_id': result['id']}),
                    'isBase64Encoded': False
                }
            
            elif action == 'update_balance':
                new_balance = body_data.get('balance')
                
                cur.execute(f"INSERT INTO users (user_id, balance) VALUES ('{user_id}', {new_balance}) ON CONFLICT (user_id) DO UPDATE SET balance = {new_balance}")
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
