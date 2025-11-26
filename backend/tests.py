from django.test import TestCase
from rest_framework.test import APIClient
from datetime import date, timedelta

class TaskAnalysisTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.analyze_url = '/api/tasks/analyze/'
        
    def test_past_due_task_priority(self):
        """Test that past-due tasks get highest priority"""
        tasks = [
            {
                'task_id': 'T1',
                'title': 'Past Due Task',
                'due_date': str(date.today() - timedelta(days=2)),
                'estimated_hours': 3,
                'importance': 5,
                'dependencies': []
            },
            {
                'task_id': 'T2',
                'title': 'Future Task',
                'due_date': str(date.today() + timedelta(days=10)),
                'estimated_hours': 3,
                'importance': 5,
                'dependencies': []
            }
        ]
        
        response = self.client.post(
            self.analyze_url, 
            {'tasks': tasks, 'strategy': 'smart_balance'},
            format='json'
        )
        
        self.assertEqual(response.status_code, 200)
        # Past due task should be ranked first
        self.assertEqual(response.data['tasks'][0]['task_id'], 'T1')
        
    def test_circular_dependency_detection(self):
        """Test circular dependency detection"""
        tasks = [
            {
                'task_id': 'T1',
                'title': 'Task 1',
                'due_date': str(date.today() + timedelta(days=5)),
                'estimated_hours': 3,
                'importance': 5,
                'dependencies': ['T2']
            },
            {
                'task_id': 'T2',
                'title': 'Task 2',
                'due_date': str(date.today() + timedelta(days=5)),
                'estimated_hours': 3,
                'importance': 5,
                'dependencies': ['T1']  # Circular!
            }
        ]
        
        response = self.client.post(
            self.analyze_url,
            {'tasks': tasks},
            format='json'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('Circular dependencies detected', response.data['error'])
        
    def test_missing_data_handling(self):
        """Test handling of missing/invalid data"""
        tasks = [
            {
                'task_id': 'T1',
                'title': 'Invalid Task',
                'due_date': str(date.today()),
                'estimated_hours': -5,  # Invalid
                'importance': 15,  # Out of range
                'dependencies': []
            }
        ]
        
        response = self.client.post(
            self.analyze_url,
            {'tasks': tasks},
            format='json'
        )
        
        self.assertEqual(response.status_code, 400)
        
    def test_empty_task_list(self):
        """Test response with no tasks"""
        response = self.client.post(
            self.analyze_url,
            {'tasks': []},
            format='json'
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('No tasks provided', response.data['error'])
