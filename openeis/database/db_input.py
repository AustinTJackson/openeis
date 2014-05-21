'''
Created on Apr 28, 2014

- assumes that each algo run would create a new table with a unique id
TODO: import database Table object and TableColumn object from Django database model
'''

# from schema.schema import sensordata
# from projects.models import (Table, 
#                              TableColumn,
#                              IntTableData, 
#                              StringTableData, 
#                              FloatTableData, 
#                              BooleanTableData, 
#                              TimeTableData)

db_type_map = {
               "int":"inttabledata_set",
               "string":"stringtabledata_set",
               "float":"floattabledata_set",
               "boolean":"booleantabledata_set",
               "datetime":"timetabledata_set"
               }

'''
example input map:

input_map = 
{
    'OAT_TEMPS': ('topic1','topic2', 'topic3'),
    'OCC_MODE': ('topic4',)
}

'''

from  django.db.models import Sum

from foo import get_sensor

from itertools import dropwhile, takewhile

from datetime import datetime
from collections import defaultdict

class DatabaseInput:
    
    def __init__(self,input_id, topic_map):
        '''
        Expected topic_map:
        {
            'OAT_TEMPS': ('topic1','topic2', 'topic3'),
            'OCC_MODE': ('topic4',)
        }        
        '''
        
        self.topic_map = topic_map.copy()
        
        self.sensor_map = {}
        for input_name, topics in self.topic_map.items():
            self.column_map[input_name] = tuple(get_sensor(input_id,x) for x in topics)
        
             
    def get_topics(self):
        return self.topic_map.copy()    
    
    def get_start_end_times(self):
        """Return a tuple of datetime objects representing the start and end times of the data."""
        pass
    
    @staticmethod
    def merge(*args, drop_partial_lines=True):
        '''
            args  - one or more results returned from get_query_sets() method
            drop_partial_lines - whether to drop incomplete sets, missing values are represented by None
        '''
        def q_drop_generator(q_set):
            next_timestamp = datetime(1,1,1) #In the beginning...
            for result in q_set:
                if result['time'] >= next_timestamp:
                    next_timestamp = yield result
            
        def merge_drop():
            "Drop incomplete rows"            
            managed_query_sets = []
            
            for group, query_set_list in args:
                for query_set in query_set_list:                    
                    managed_query_sets.append((group,q_drop_generator(query_set)))
            try:
                current = [x[1].next() for x in managed_query_sets]
                newest = max(current, key=lambda x:x['time'] )['time']                
            except StopIteration:
                return
            
            while True:
                if all(x['time'] == newest for x in current):
                    values = defaultdict(list)
                    result = {'time': newest, 'values':values }
                    for value, query in zip(current, managed_query_sets):
                        values[query[0]].append(value['values'])
                        
                    yield result
                        
                for group, qs in managed_query_sets:
                    pass
                
        
        def merge_no_drop():
            "Incomplete rows provide a None for missing values."
            pass
            
            
        
        return merge_drop if drop_partial_lines else merge_no_drop
    
    def get_query_sets(self, group_name, 
                       order_by='time',
                       filter_=None, 
                       exclude=None, 
                       group_by=None, group_by_aggregation=Sum):
        """
        group - group of columns to retrieve.
        order_by - column to order_by ('time' or 'values'), defaults to 'time'
        filter_ - dictionary of filter() arguments
        exclude - dictionary of exclude() arguments
        
        group_by - period to group by 
                   valid arguments are "minute", "hour" "day" "month" "year" "all"
                   All returns the aggregated value and not a query set.
                   
        group_by_aggregation - Aggregation method to use. Defaults to Sum. 
                               See https://docs.djangoproject.com/en/1.6/ref/models/querysets/#aggregation-functions 
        
        
        returns => {group:result list}
        This preps output to be input to self.merge()
        """
        qs = (x() for _,x in self.column_map[group_name])
        
        if filter_ is not None:
            qs = (x.filter(**filter_) for x in qs)
            
        if exclude is not None:
            qs = (x.exclude(**exclude) for x in qs)
            
        if group_by is not None:
            if group_by != 'all':
                qs = (x.group_by(group_by, group_by_aggregation) for x in qs)
            else:
                return {group_name: [x.aggragate(value=group_by_aggregation('values'))['value'] for x in qs]}
        
        return {group_name: [x.order_by(order_by).values('time', 'values').iterator() for x in qs]}
