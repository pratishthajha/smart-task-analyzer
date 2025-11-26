from datetime import datetime, date
from typing import List, Dict

def calculate_priority_score(task_data: Dict, all_tasks: List[Dict], strategy: str = 'smart_balance') -> tuple:
    """
    Calculate priority score and generate explanation
    Returns: (score, explanation)
    """
    # Calculate individual scores
    urgency = calculate_urgency(task_data.get('due_date'))
    importance = task_data.get('importance', 5)
    effort = calculate_effort_score(task_data.get('estimated_hours', 5))
    dependency = calculate_dependency_score(task_data, all_tasks)
    
    # Apply strategy weights
    if strategy == 'smart_balance':
        score = (urgency * 0.3 + importance * 0.3 + effort * 0.2 + dependency * 0.2)
    elif strategy == 'fastest_wins':
        score = (effort * 0.5 + urgency * 0.3 + importance * 0.2)
    elif strategy == 'high_impact':
        score = (importance * 0.5 + dependency * 0.3 + urgency * 0.2)
    elif strategy == 'deadline_driven':
        score = (urgency * 0.6 + importance * 0.3 + dependency * 0.1)
    else:
        score = (urgency + importance + effort + dependency) / 4
    
    explanation = generate_explanation(urgency, importance, effort, dependency)
    
    return round(score, 2), explanation

def calculate_urgency(due_date_str) -> float:
    """Calculate urgency based on days until due date"""
    try:
        if isinstance(due_date_str, str):
            due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
        else:
            due_date = due_date_str
        
        today = date.today()
        days_until_due = (due_date - today).days
        
        if days_until_due < 0:
            return 10.0  # Past due
        elif days_until_due == 0:
            return 9.5   # Due today
        elif days_until_due <= 3:
            return 9.0
        elif days_until_due <= 7:
            return 7.0
        elif days_until_due <= 14:
            return 5.0
        elif days_until_due <= 30:
            return 3.0
        else:
            return 1.0
    except:
        return 5.0  # Default

def calculate_effort_score(hours: float) -> float:
    """Lower effort = quick wins = higher score"""
    try:
        hours = float(hours)
        if hours <= 1:
            return 10.0
        elif hours <= 3:
            return 8.0
        elif hours <= 5:
            return 6.0
        elif hours <= 8:
            return 4.0
        else:
            return 2.0
    except:
        return 5.0

def calculate_dependency_score(task: Dict, all_tasks: List[Dict]) -> float:
    """Tasks that block others get higher priority"""
    task_id = task.get('task_id', '')
    blocking_count = 0
    
    for other_task in all_tasks:
        dependencies = other_task.get('dependencies', [])
        if task_id in dependencies:
            blocking_count += 1
    
    return min(blocking_count * 2.5, 10)  # Cap at 10

def generate_explanation(urgency: float, importance: float, effort: float, dependency: float) -> str:
    """Generate human-readable explanation"""
    reasons = []
    
    if urgency >= 9:
        reasons.append("⚠️ Due very soon or overdue")
    elif urgency >= 7:
        reasons.append("📅 Due within a week")
    
    if importance >= 8:
        reasons.append("⭐ High importance")
    elif importance >= 6:
        reasons.append("Medium importance")
    
    if effort >= 8:
        reasons.append("⚡ Quick win (low effort)")
    
    if dependency >= 5:
        reasons.append("🔗 Blocks other tasks")
    
    if not reasons:
        reasons.append("Standard priority task")
    
    return " | ".join(reasons)

def detect_circular_dependencies(tasks: List[Dict]) -> List[str]:
    """Detect circular dependencies in task list"""
    def has_cycle(task_id, visited, rec_stack, task_map):
        visited.add(task_id)
        rec_stack.add(task_id)
        
        task = task_map.get(task_id, {})
        for dep in task.get('dependencies', []):
            if dep not in visited:
                if has_cycle(dep, visited, rec_stack, task_map):
                    return True
            elif dep in rec_stack:
                return True
        
        rec_stack.remove(task_id)
        return False
    
    task_map = {t['task_id']: t for t in tasks}
    visited = set()
    circular = []
    
    for task in tasks:
        task_id = task['task_id']
        if task_id not in visited:
            if has_cycle(task_id, visited, set(), task_map):
                circular.append(task_id)
    
    return circular
