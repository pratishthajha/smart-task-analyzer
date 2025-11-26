from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import TaskInputSerializer, TaskOutputSerializer
from .scoring import calculate_priority_score, detect_circular_dependencies

@api_view(['POST'])
def analyze_tasks(request):
    """
    Analyze and prioritize a list of tasks
    POST /api/tasks/analyze/
    """
    tasks_data = request.data.get('tasks', [])
    strategy = request.data.get('strategy', 'smart_balance')
    
    if not tasks_data:
        return Response(
            {'error': 'No tasks provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate input
    serializer = TaskInputSerializer(data=tasks_data, many=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Check for circular dependencies
    circular = detect_circular_dependencies(tasks_data)
    if circular:
        return Response(
            {
                'error': 'Circular dependencies detected',
                'affected_tasks': circular
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Calculate priority scores
    analyzed_tasks = []
    for task in tasks_data:
        score, explanation = calculate_priority_score(task, tasks_data, strategy)
        task['priority_score'] = score
        task['explanation'] = explanation
        analyzed_tasks.append(task)
    
    # Sort by priority score (highest first)
    analyzed_tasks.sort(key=lambda x: x['priority_score'], reverse=True)
    
    # Serialize output
    output_serializer = TaskOutputSerializer(analyzed_tasks, many=True)
    
    return Response({
        'tasks': output_serializer.data,
        'strategy': strategy,
        'total_tasks': len(analyzed_tasks)
    })

@api_view(['POST'])
def suggest_tasks(request):
    """
    Get top 3 recommended tasks to work on
    POST /api/tasks/suggest/
    """
    tasks_data = request.data.get('tasks', [])
    strategy = request.data.get('strategy', 'smart_balance')
    
    if not tasks_data:
        return Response(
            {'error': 'No tasks provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate and analyze
    serializer = TaskInputSerializer(data=tasks_data, many=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Calculate scores
    analyzed_tasks = []
    for task in tasks_data:
        score, explanation = calculate_priority_score(task, tasks_data, strategy)
        task['priority_score'] = score
        task['explanation'] = explanation
        analyzed_tasks.append(task)
    
    # Sort and get top 3
    analyzed_tasks.sort(key=lambda x: x['priority_score'], reverse=True)
    top_3 = analyzed_tasks[:3]
    
    return Response({
        'suggested_tasks': top_3,
        'strategy': strategy,
        'message': f'Top {len(top_3)} tasks recommended based on {strategy} strategy'
    })

@api_view(['GET'])
def health_check(request):
    """Simple health check endpoint"""
    return Response({'status': 'ok', 'message': 'Task Analyzer API is running'})
