/**
 * Compulsory Question Pools for Technical Coding Rounds
 * - 10 Standard SQL Questions
 * - 10 LeetCode-style Algorithmic Programming Questions
 *
 * Starter codes contain function signatures with placeholder comments:
 * "// write your code inside function call"
 */

const SQL_QUESTIONS = [
  {
    id: 'sql_1',
    title: 'Second Highest Salary',
    category: 'sql',
    type: 'coding',
    language: 'sql',
    allocatedMinutes: 10,
    question: `Write an SQL query to find the second highest salary from the Employee table. If there is no second highest salary, the query should report NULL.

Table: Employee
+-------------+------+
| Column Name | Type |
+-------------+------+
| id          | int  |
| salary      | int  |
+-------------+------+

Example:
Input Employee:
+----+--------+
| id | salary |
+----+--------+
| 1  | 100    |
| 2  | 200    |
| 3  | 300    |
+----+--------+
Output: 200`,
    starterCode: {
      sql: `-- write your code inside function call\nSELECT \n    \nFROM Employee;`,
      javascript: `function secondHighestSalary(employees) {\n    // write your code inside function call\n    \n}`,
      python: `def second_highest_salary(employees):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public Integer secondHighestSalary(int[] salaries) {\n        // write your code inside function call\n        return null;\n    }\n}`
    },
    referenceSQL: `SELECT MAX(salary) AS SecondHighestSalary FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee);`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "Employee: [[1, 100], [2, 200], [3, 300]]", expected: "200" },
      { id: 2, isHidden: false, name: "Visible Case 2 (Single Row)", input: "Employee: [[1, 100]]", expected: "null" },
      { id: 3, isHidden: true, name: "Hidden Case 1 (All duplicate salaries)", input: "Employee: [[1, 100], [2, 100], [3, 100]]", expected: "null" }
    ]
  },
  {
    id: 'sql_2',
    title: 'Nth Highest Salary',
    category: 'sql',
    type: 'coding',
    language: 'sql',
    allocatedMinutes: 10,
    question: `Write an SQL query to find the Nth highest salary from the Employee table. If there is no Nth highest salary, return NULL.

Table: Employee
+-------------+------+
| Column Name | Type |
+-------------+------+
| id          | int  |
| salary      | int  |
+-------------+------+`,
    starterCode: {
      sql: `-- write your code inside function call\nSELECT \n    \nFROM Employee;`,
      javascript: `function getNthHighestSalary(employees, n) {\n    // write your code inside function call\n    \n}`,
      python: `def get_nth_highest_salary(employees, n):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public Integer getNthHighestSalary(int[] salaries, int n) {\n        // write your code inside function call\n        return null;\n    }\n}`
    },
    referenceSQL: `SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1;`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "Employee: [[1, 100], [2, 200], [3, 300]], N = 2", expected: "200" },
      { id: 2, isHidden: false, name: "Visible Case 2", input: "Employee: [[1, 100]], N = 2", expected: "null" },
      { id: 3, isHidden: true, name: "Hidden Case 1", input: "Employee: [[1, 500], [2, 400], [3, 300], [4, 200]], N = 3", expected: "300" }
    ]
  },
  {
    id: 'sql_3',
    title: 'Duplicate Records',
    category: 'sql',
    type: 'coding',
    language: 'sql',
    allocatedMinutes: 10,
    question: `Write an SQL query to report all the duplicate emails in the Person table.

Table: Person
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| email       | varchar |
+-------------+---------+`,
    starterCode: {
      sql: `-- write your code inside function call\nSELECT \n    \nFROM Person;`,
      javascript: `function findDuplicateEmails(persons) {\n    // write your code inside function call\n    \n}`,
      python: `def find_duplicate_emails(persons):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public List<String> findDuplicateEmails(List<String> emails) {\n        // write your code inside function call\n        return new ArrayList<>();\n    }\n}`
    },
    referenceSQL: `SELECT email FROM Person GROUP BY email HAVING COUNT(email) > 1;`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "Person: [[1, 'a@b.com'], [2, 'c@d.com'], [3, 'a@b.com']]", expected: "['a@b.com']" },
      { id: 2, isHidden: true, name: "Hidden Case 1 (All Unique)", input: "Person: [[1, 'x@y.com'], [2, 'z@w.com']]", expected: "[]" }
    ]
  },
  {
    id: 'sql_4',
    title: 'Delete Duplicates',
    category: 'sql',
    type: 'coding',
    language: 'sql',
    allocatedMinutes: 10,
    question: `Write an SQL query to delete all duplicate emails in the Person table, keeping only one unique email with the smallest id.

Table: Person
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| email       | varchar |
+-------------+---------+`,
    starterCode: {
      sql: `-- write your code inside function call\nDELETE \n    \nFROM Person;`,
      javascript: `function deleteDuplicates(persons) {\n    // write your code inside function call\n    \n}`,
      python: `def delete_duplicates(persons):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public void deleteDuplicates() {\n        // write your code inside function call\n    }\n}`
    },
    referenceSQL: `DELETE p1 FROM Person p1, Person p2 WHERE p1.email = p2.email AND p1.id > p2.id;`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "Person: [[1, 'john@example.com'], [2, 'bob@example.com'], [3, 'john@example.com']]", expected: "Kept id 1 and 2, deleted id 3" },
      { id: 2, isHidden: true, name: "Hidden Case 1", input: "Person: [[1, 'a@b.com'], [2, 'a@b.com'], [3, 'a@b.com']]", expected: "Kept id 1, deleted id 2 and 3" }
    ]
  },
  {
    id: 'sql_5',
    title: 'Employees > Manager Salary',
    category: 'sql',
    type: 'coding',
    language: 'sql',
    allocatedMinutes: 10,
    question: `Write an SQL query to find the employees who earn more than their managers.

Table: Employee
+-------------+---------+
| Column Name | Type    |
+-------------+---------+
| id          | int     |
| name        | varchar |
| salary      | int     |
| managerId   | int     |
+-------------+---------+`,
    starterCode: {
      sql: `-- write your code inside function call\nSELECT \n    \nFROM Employee e;`,
      javascript: `function employeesEarningMoreThanManager(employees) {\n    // write your code inside function call\n    \n}`,
      python: `def employees_earning_more_than_manager(employees):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public List<String> employeesEarningMoreThanManager() {\n        // write your code inside function call\n        return new ArrayList<>();\n    }\n}`
    },
    referenceSQL: `SELECT e.name AS Employee FROM Employee e JOIN Employee m ON e.managerId = m.id WHERE e.salary > m.salary;`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "Employees: [[1, 'Joe', 70000, 3], [2, 'Henry', 80000, 4], [3, 'Sam', 60000, null], [4, 'Max', 90000, null]]", expected: "['Joe']" },
      { id: 2, isHidden: true, name: "Hidden Case 1", input: "Employees: [[1, 'Alice', 50000, 2], [2, 'Bob', 45000, null]]", expected: "['Alice']" }
    ]
  },
  {
    id: 'sql_6',
    title: 'Highest Salary per Department',
    category: 'sql',
    type: 'coding',
    language: 'sql',
    allocatedMinutes: 10,
    question: `Write an SQL query to find employees who have the highest salary in each department.

Table: Employee (id, name, salary, departmentId)
Table: Department (id, name)`,
    starterCode: {
      sql: `-- write your code inside function call\nSELECT \n    \nFROM Employee e\nJOIN Department d ON e.departmentId = d.id;`,
      javascript: `function highestSalaryPerDepartment(employees, departments) {\n    // write your code inside function call\n    \n}`,
      python: `def highest_salary_per_department(employees, departments):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public List<String> highestSalaryPerDepartment() {\n        // write your code inside function call\n        return new ArrayList<>();\n    }\n}`
    },
    referenceSQL: `SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary FROM Employee e JOIN Department d ON e.departmentId = d.id WHERE (e.departmentId, e.salary) IN (SELECT departmentId, MAX(salary) FROM Employee GROUP BY departmentId);`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "IT: [Joe: 85000, Max: 90000], Sales: [Henry: 80000, Sam: 60000]", expected: "IT: Max (90000), Sales: Henry (80000)" },
      { id: 2, isHidden: true, name: "Hidden Case 1 (Tied max salaries)", input: "IT: [A: 50000, B: 50000]", expected: "IT: A (50000) and B (50000)" }
    ]
  },
  {
    id: 'sql_7',
    title: 'Top 3 Salaries per Department',
    category: 'sql',
    type: 'coding',
    language: 'sql',
    allocatedMinutes: 10,
    question: `Write an SQL query to find the employees who earn in the top three unique salaries for each department using DENSE_RANK.

Table: Employee (id, name, salary, departmentId)
Table: Department (id, name)`,
    starterCode: {
      sql: `-- write your code inside function call\nSELECT \n    \nFROM Employee e;`,
      javascript: `function top3SalariesPerDepartment(employees, departments) {\n    // write your code inside function call\n    \n}`,
      python: `def top_3_salaries(employees, departments):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public List<String> top3Salaries() {\n        // write your code inside function call\n        return new ArrayList<>();\n    }\n}`
    },
    referenceSQL: `SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary FROM (SELECT id, name, salary, departmentId, DENSE_RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC) as rnk FROM Employee) e JOIN Department d ON e.departmentId = d.id WHERE e.rnk <= 3;`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "IT Dept: salaries [90000, 85000, 85000, 70000, 69000]", expected: "Salaries 90000, 85000, 70000 included" },
      { id: 2, isHidden: true, name: "Hidden Case 1", input: "Sales: only 2 employees", expected: "Both employees included" }
    ]
  },
  {
    id: 'sql_8',
    title: 'Customers Never Ordered',
    category: 'sql',
    type: 'coding',
    language: 'sql',
    allocatedMinutes: 10,
    question: `Write an SQL query to report all customers who never placed any orders.

Table: Customers (id, name)
Table: Orders (id, customerId)`,
    starterCode: {
      sql: `-- write your code inside function call\nSELECT \n    \nFROM Customers;`,
      javascript: `function customersNeverOrdered(customers, orders) {\n    // write your code inside function call\n    \n}`,
      python: `def customers_never_ordered(customers, orders):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public List<String> customersNeverOrdered() {\n        // write your code inside function call\n        return new ArrayList<>();\n    }\n}`
    },
    referenceSQL: `SELECT name AS Customers FROM Customers WHERE id NOT IN (SELECT customerId FROM Orders WHERE customerId IS NOT NULL);`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "Customers: [[1, 'Joe'], [2, 'Henry'], [3, 'Sam'], [4, 'Max']], Orders: [[1, 3], [2, 1]]", expected: "['Henry', 'Max']" },
      { id: 2, isHidden: true, name: "Hidden Case 1 (All ordered)", input: "Customers: [[1, 'A']], Orders: [[1, 1]]", expected: "[]" }
    ]
  },
  {
    id: 'sql_9',
    title: 'Above Average Salary',
    category: 'sql',
    type: 'coding',
    language: 'sql',
    allocatedMinutes: 10,
    question: `Write an SQL query to find all employees whose salary is strictly greater than the average salary of their respective department.

Table: Employee (id, name, salary, departmentId)`,
    starterCode: {
      sql: `-- write your code inside function call\nSELECT \n    \nFROM Employee e;`,
      javascript: `function aboveAverageSalary(employees) {\n    // write your code inside function call\n    \n}`,
      python: `def above_average_salary(employees):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public List<String> aboveAverageSalary() {\n        // write your code inside function call\n        return new ArrayList<>();\n    }\n}`
    },
    referenceSQL: `SELECT e.name, e.salary, e.departmentId FROM Employee e WHERE e.salary > (SELECT AVG(salary) FROM Employee WHERE departmentId = e.departmentId);`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "Dept 1: salaries [4000, 6000] (avg 5000)", expected: "Employee with salary 6000" },
      { id: 2, isHidden: true, name: "Hidden Case 1", input: "Dept 2: salaries [5000, 5000]", expected: "None (not strictly greater)" }
    ]
  },
  {
    id: 'sql_10',
    title: 'RANK vs DENSE_RANK vs ROW_NUMBER',
    category: 'sql',
    type: 'coding',
    language: 'sql',
    allocatedMinutes: 10,
    question: `Write an SQL query using window functions that returns id, salary, along with row_num (using ROW_NUMBER), rnk (using RANK), and dense_rnk (using DENSE_RANK), ordered by salary descending.

Table: Employee (id, salary)`,
    starterCode: {
      sql: `-- write your code inside function call\nSELECT \n    \nFROM Employee;`,
      javascript: `function rankSalaries(employees) {\n    // write your code inside function call\n    \n}`,
      python: `def rank_salaries(employees):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public void rankSalaries() {\n        // write your code inside function call\n    }\n}`
    },
    referenceSQL: `SELECT id, salary, ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num, RANK() OVER (ORDER BY salary DESC) AS rnk, DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk FROM Employee;`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "Salaries: [100, 100, 80]", expected: "row_num: [1,2,3], rnk: [1,1,3], dense_rnk: [1,1,2]" },
      { id: 2, isHidden: true, name: "Hidden Case 1 (Strictly distinct)", input: "Salaries: [300, 200, 100]", expected: "All three window functions yield [1, 2, 3]" }
    ]
  }
];

const PROGRAMMING_QUESTIONS = [
  {
    id: 'prog_1',
    title: 'Two Sum',
    category: 'coding',
    type: 'coding',
    functionName: 'twoSum',
    allocatedMinutes: 15,
    question: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.`,
    starterCode: {
      javascript: `function twoSum(nums, target) {\n    // write your code inside function call\n    \n}`,
      python: `def twoSum(nums, target):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // write your code inside function call\n        return new int[]{};\n    }\n}`
    },
    referenceSolution: `function twoSum(nums, target) {
      const map = new Map();
      for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (map.has(comp)) return [map.get(comp), i];
        map.set(nums[i], i);
      }
      return [];
    }`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "nums = [2,7,11,15], target = 9", rawArgs: [[2, 7, 11, 15], 9], expected: "[0,1]" },
      { id: 2, isHidden: false, name: "Visible Case 2", input: "nums = [3,2,4], target = 6", rawArgs: [[3, 2, 4], 6], expected: "[1,2]" },
      { id: 3, isHidden: true, name: "Hidden Case 1 (Duplicate elements)", input: "nums = [3,3], target = 6", rawArgs: [[3, 3], 6], expected: "[0,1]" }
    ]
  },
  {
    id: 'prog_2',
    title: 'Reverse a Linked List',
    category: 'coding',
    type: 'coding',
    functionName: 'reverseList',
    allocatedMinutes: 15,
    question: `Given the head of a singly linked list, reverse the list, and return the reversed list.

Example: [1,2,3,4,5] -> [5,4,3,2,1]`,
    starterCode: {
      javascript: `function reverseList(head) {\n    // write your code inside function call\n    \n}`,
      python: `def reverseList(head):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public ListNode reverseList(ListNode head) {\n        // write your code inside function call\n        return null;\n    }\n}`
    },
    referenceSolution: `function reverseList(head) {
      let prev = null;
      let curr = head;
      while (curr) {
        let next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
      }
      return prev;
    }`,
    isLinkedList: true,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "head = [1,2,3,4,5]", rawArgs: [[1, 2, 3, 4, 5]], expected: "[5,4,3,2,1]" },
      { id: 2, isHidden: false, name: "Visible Case 2", input: "head = [1,2]", rawArgs: [[1, 2]], expected: "[2,1]" },
      { id: 3, isHidden: true, name: "Hidden Case 1 (Empty list)", input: "head = []", rawArgs: [[]], expected: "[]" }
    ]
  },
  {
    id: 'prog_3',
    title: 'Find Duplicate Elements in an Array',
    category: 'coding',
    type: 'coding',
    functionName: 'findDuplicates',
    allocatedMinutes: 15,
    question: `Given an integer array nums, identify and return all duplicate values present in the array using a HashSet/HashMap.

Example: [4,3,2,7,8,2,3,1] -> [2,3]`,
    starterCode: {
      javascript: `function findDuplicates(nums) {\n    // write your code inside function call\n    \n}`,
      python: `def findDuplicates(nums):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public List<Integer> findDuplicates(int[] nums) {\n        // write your code inside function call\n        return new ArrayList<>();\n    }\n}`
    },
    referenceSolution: `function findDuplicates(nums) {
      const seen = new Set();
      const duplicates = new Set();
      for (const num of nums) {
        if (seen.has(num)) duplicates.add(num);
        else seen.add(num);
      }
      return Array.from(duplicates).sort((a,b) => a - b);
    }`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "nums = [4,3,2,7,8,2,3,1]", rawArgs: [[4, 3, 2, 7, 8, 2, 3, 1]], expected: "[2,3]" },
      { id: 2, isHidden: false, name: "Visible Case 2", input: "nums = [1,1,2]", rawArgs: [[1, 1, 2]], expected: "[1]" },
      { id: 3, isHidden: true, name: "Hidden Case 1 (No duplicates)", input: "nums = [1,2,3,4,5]", rawArgs: [[1, 2, 3, 4, 5]], expected: "[]" }
    ]
  },
  {
    id: 'prog_4',
    title: 'Find Missing Number',
    category: 'coding',
    type: 'coding',
    functionName: 'findMissingNumber',
    allocatedMinutes: 15,
    question: `Given an array nums containing n distinct numbers in the range [1, n+1], find and return the one number that is missing from the array.

Example: nums = [1, 2, 3, 5] -> 4`,
    starterCode: {
      javascript: `function findMissingNumber(nums) {\n    // write your code inside function call\n    \n}`,
      python: `def findMissingNumber(nums):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public int findMissingNumber(int[] nums) {\n        // write your code inside function call\n        return -1;\n    }\n}`
    },
    referenceSolution: `function findMissingNumber(nums) {
      const n = nums.length + 1;
      const expectedSum = (n * (n + 1)) / 2;
      const actualSum = nums.reduce((a, b) => a + b, 0);
      return expectedSum - actualSum;
    }`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "nums = [1,2,3,5]", rawArgs: [[1, 2, 3, 5]], expected: "4" },
      { id: 2, isHidden: false, name: "Visible Case 2", input: "nums = [2,3,1,5]", rawArgs: [[2, 3, 1, 5]], expected: "4" },
      { id: 3, isHidden: true, name: "Hidden Case 1 (Missing last number)", input: "nums = [1,2,3,4]", rawArgs: [[1, 2, 3, 4]], expected: "5" }
    ]
  },
  {
    id: 'prog_5',
    title: 'Valid Parentheses',
    category: 'coding',
    type: 'coding',
    functionName: 'isValid',
    allocatedMinutes: 15,
    question: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
Concept: Stack`,
    starterCode: {
      javascript: `function isValid(s) {\n    // write your code inside function call\n    \n}`,
      python: `def isValid(s):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public boolean isValid(String s) {\n        // write your code inside function call\n        return false;\n    }\n}`
    },
    referenceSolution: `function isValid(s) {
      const stack = [];
      const map = { ')': '(', '}': '{', ']': '[' };
      for (const char of s) {
        if (char === '(' || char === '{' || char === '[') {
          stack.push(char);
        } else {
          if (stack.pop() !== map[char]) return false;
        }
      }
      return stack.length === 0;
    }`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "s = '()[]{}'", rawArgs: ["()[]{}"], expected: "true" },
      { id: 2, isHidden: false, name: "Visible Case 2", input: "s = '(]'", rawArgs: ["(]"], expected: "false" },
      { id: 3, isHidden: true, name: "Hidden Case 1", input: "s = '([{}])'", rawArgs: ["([{}])"], expected: "true" }
    ]
  },
  {
    id: 'prog_6',
    title: 'Binary Search',
    category: 'coding',
    type: 'coding',
    functionName: 'search',
    allocatedMinutes: 15,
    question: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.`,
    starterCode: {
      javascript: `function search(nums, target) {\n    // write your code inside function call\n    \n}`,
      python: `def search(nums, target):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public int search(int[] nums, int target) {\n        // write your code inside function call\n        return -1;\n    }\n}`
    },
    referenceSolution: `function search(nums, target) {
      let left = 0, right = nums.length - 1;
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
      }
      return -1;
    }`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "nums = [-1,0,3,5,9,12], target = 9", rawArgs: [[-1, 0, 3, 5, 9, 12], 9], expected: "4" },
      { id: 2, isHidden: false, name: "Visible Case 2", input: "nums = [-1,0,3,5,9,12], target = 2", rawArgs: [[-1, 0, 3, 5, 9, 12], 2], expected: "-1" },
      { id: 3, isHidden: true, name: "Hidden Case 1 (Single element)", input: "nums = [5], target = 5", rawArgs: [[5], 5], expected: "0" }
    ]
  },
  {
    id: 'prog_7',
    title: 'Maximum Subarray Sum',
    category: 'coding',
    type: 'coding',
    functionName: 'maxSubArray',
    allocatedMinutes: 15,
    question: `Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.

Concept: Kadane's Algorithm (O(n) time)`,
    starterCode: {
      javascript: `function maxSubArray(nums) {\n    // write your code inside function call\n    \n}`,
      python: `def maxSubArray(nums):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        // write your code inside function call\n        return 0;\n    }\n}`
    },
    referenceSolution: `function maxSubArray(nums) {
      let maxSoFar = nums[0];
      let currMax = nums[0];
      for (let i = 1; i < nums.length; i++) {
        currMax = Math.max(nums[i], currMax + nums[i]);
        maxSoFar = Math.max(maxSoFar, currMax);
      }
      return maxSoFar;
    }`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", rawArgs: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: "6" },
      { id: 2, isHidden: false, name: "Visible Case 2", input: "nums = [1]", rawArgs: [[1]], expected: "1" },
      { id: 3, isHidden: true, name: "Hidden Case 1 (All negative)", input: "nums = [-5,-2,-8,-1]", rawArgs: [[-5, -2, -8, -1]], expected: "-1" }
    ]
  },
  {
    id: 'prog_8',
    title: 'Merge Two Sorted Arrays',
    category: 'coding',
    type: 'coding',
    functionName: 'mergeSortedArrays',
    allocatedMinutes: 15,
    question: `Given two sorted integer arrays nums1 and nums2, merge them into a single sorted array.

Example: [1,3,5] + [2,4,6] -> [1,2,3,4,5,6]
Concept: Two Pointers`,
    starterCode: {
      javascript: `function mergeSortedArrays(nums1, nums2) {\n    // write your code inside function call\n    \n}`,
      python: `def mergeSortedArrays(nums1, nums2):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public int[] mergeSortedArrays(int[] nums1, int[] nums2) {\n        // write your code inside function call\n        return new int[]{};\n    }\n}`
    },
    referenceSolution: `function mergeSortedArrays(nums1, nums2) {
      let i = 0, j = 0;
      const merged = [];
      while (i < nums1.length && j < nums2.length) {
        if (nums1[i] <= nums2[j]) merged.push(nums1[i++]);
        else merged.push(nums2[j++]);
      }
      while (i < nums1.length) merged.push(nums1[i++]);
      while (j < nums2.length) merged.push(nums2[j++]);
      return merged;
    }`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "nums1 = [1,3,5], nums2 = [2,4,6]", rawArgs: [[1, 3, 5], [2, 4, 6]], expected: "[1,2,3,4,5,6]" },
      { id: 2, isHidden: false, name: "Visible Case 2", input: "nums1 = [], nums2 = [1]", rawArgs: [[], [1]], expected: "[1]" },
      { id: 3, isHidden: true, name: "Hidden Case 1 (Overlapping)", input: "nums1 = [1,2], nums2 = [1,2]", rawArgs: [[1, 2], [1, 2]], expected: "[1,1,2,2]" }
    ]
  },
  {
    id: 'prog_9',
    title: 'Longest Substring Without Repeating Characters',
    category: 'coding',
    type: 'coding',
    functionName: 'lengthOfLongestSubstring',
    allocatedMinutes: 15,
    question: `Given a string s, find the length of the longest substring without repeating characters.

Concept: Sliding Window + HashSet/HashMap (O(n) time)`,
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {\n    // write your code inside function call\n    \n}`,
      python: `def lengthOfLongestSubstring(s):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // write your code inside function call\n        return 0;\n    }\n}`
    },
    referenceSolution: `function lengthOfLongestSubstring(s) {
      let left = 0, maxLen = 0;
      const set = new Set();
      for (let right = 0; right < s.length; right++) {
        while (set.has(s[right])) {
          set.delete(s[left++]);
        }
        set.add(s[right]);
        maxLen = Math.max(maxLen, right - left + 1);
      }
      return maxLen;
    }`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "s = 'abcabcbb'", rawArgs: ["abcabcbb"], expected: "3" },
      { id: 2, isHidden: false, name: "Visible Case 2", input: "s = 'bbbbb'", rawArgs: ["bbbbb"], expected: "1" },
      { id: 3, isHidden: true, name: "Hidden Case 1", input: "s = 'pwwkew'", rawArgs: ["pwwkew"], expected: "3" }
    ]
  },
  {
    id: 'prog_10',
    title: 'Find Second Largest Element',
    category: 'coding',
    type: 'coding',
    functionName: 'findSecondLargest',
    allocatedMinutes: 15,
    question: `Given an array of integers nums, find the second-largest unique element without sorting in O(n) time. If no second largest element exists, return -1.

Concept: Array traversal, O(n)`,
    starterCode: {
      javascript: `function findSecondLargest(nums) {\n    // write your code inside function call\n    \n}`,
      python: `def findSecondLargest(nums):\n    # write your code inside function call\n    pass`,
      java: `class Solution {\n    public int findSecondLargest(int[] nums) {\n        // write your code inside function call\n        return -1;\n    }\n}`
    },
    referenceSolution: `function findSecondLargest(nums) {
      let first = -Infinity, second = -Infinity;
      for (const num of nums) {
        if (num > first) {
          second = first;
          first = num;
        } else if (num > second && num !== first) {
          second = num;
        }
      }
      return second === -Infinity ? -1 : second;
    }`,
    testCases: [
      { id: 1, isHidden: false, name: "Visible Case 1", input: "nums = [12, 35, 1, 10, 34, 1]", rawArgs: [[12, 35, 1, 10, 34, 1]], expected: "34" },
      { id: 2, isHidden: false, name: "Visible Case 2 (Single item / Equal)", input: "nums = [10, 10, 10]", rawArgs: [[10, 10, 10]], expected: "-1" },
      { id: 3, isHidden: true, name: "Hidden Case 1", input: "nums = [5, 2]", rawArgs: [[5, 2]], expected: "2" }
    ]
  }
];

module.exports = {
  SQL_QUESTIONS,
  PROGRAMMING_QUESTIONS
};
