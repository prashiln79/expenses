import React, { Component } from "react";
import { ExpenseList, ExpenseForm, UtilityForm, LoanForm, LoadingBar } from "./components/index";
import { MDCSnackbar } from "@material/snackbar/dist/mdc.snackbar.js";

import "@material/fab/dist/mdc.fab.css";
import "@material/button/dist/mdc.button.css";
import "@material/toolbar/dist/mdc.toolbar.css";
import "@material/snackbar/dist/mdc.snackbar.css";
import "@material/card/dist/mdc.card.css";

import "./App.css";

class App extends Component {
  constructor() {
    super();
    this.handleChange = this.handleChange.bind(this);
    this.verifyLogin = this.verifyLogin.bind(this);
    this.filterUtility = this.filterUtility.bind(this);
    this.clientId =
      "825310645531-8j0bnfk6ge5vb8q1j8mnq0sudop9ikod.apps.googleusercontent.com";
    this.spreadsheetId =
      process.env.REACT_APP_SHEET_ID ||
      "1uK7I_xBLxjsv934177jWlu523KVdFzV66835t6xBCQo";

    this.state = {
      signedIn: undefined,
      accounts: [],
      categories: [],
      loanCategories: [],
      expenses: [],
      loans:[],
      utilitys:[],
      totalLoan:undefined,
      totalEMI:undefined,
      currentView:'expense',
      processing: true,
      expense: {},
      currentMonth: undefined,
      previousMonth: undefined,
      showExpenseForm: false,
      maxRecToShow:30,
      pinIsVfy:sessionStorage.getItem('pinIsVfy') == 'true'?true:false,
      filteredUtilityBills:[],
    };
    sessionStorage.setItem('pinIsVfy',this.state.pinIsVfy);
  }

  componentDidMount() {
    window.gapi.load("client:auth2", () => {
      window.gapi.client
        .init({
          discoveryDocs: [
            "https://sheets.googleapis.com/$discovery/rest?version=v4"
          ],
          clientId: this.clientId,
          scope:
            "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata.readonly"
        })
        .then(() => {
          window.gapi.auth2
            .getAuthInstance()
            .isSignedIn.listen(this.signedInChanged);
          this.signedInChanged(
            window.gapi.auth2.getAuthInstance().isSignedIn.get()
          );
        });
    });
    document.addEventListener("keyup", this.onKeyPressed.bind(this));
  }

  onKeyPressed = (e) => {
    if (this.state.signedIn === true) {
      if (this.state.showExpenseForm === false) {
        if (e.keyCode === 65) { // a
          this.onExpenseNew()
        }
      } else {
        if (e.keyCode === 27) { // escape
          this.handleExpenseCancel()
        }
      }
    }
  }

  signedInChanged = (signedIn) => {
    this.setState({ signedIn: signedIn });
    if (this.state.signedIn) {
      this.load();
    }
  }

  handleExpenseSubmit = () => {
    this.setState({ processing: true, showExpenseForm: false });

    let id ;
    let state ;

    switch (this.state.currentView) {
      
      case 'expense':
        id = this.state.expense.id;
        state = this.state.expense;
      break;

      case 'loan':
        id = this.state.loan.id;
        state = this.state.loan;
      break;

      case 'utility':
        id = this.state.utility.id;
        state = this.state.utility;
      break;

    }

    const submitAction = (id
      ? this.update
      : this.append).bind(this);
    submitAction(state).then(
      response => {
        this.snackbar.show({
          message: `Expense ${id ? "updated" : "added"}!`
        });
        this.load();
      },
      response => {
        console.error("Something went wrong");
        console.error(response);
        this.setState({ loading: false });
      }
    );
  }

  handleExpenseChange = (attribute, value) => {

    switch (this.state.currentView) {
      
      case 'expense':
        this.setState({
          expense: Object.assign({}, this.state.expense, { [attribute]: value })
        });
      break;

      case 'loan':
        this.setState({
          loan: Object.assign({}, this.state.loan, { [attribute]: value })
        });
      break;

      case 'utility':
        this.setState({
          utility: Object.assign({}, this.state.utility, { [attribute]: value })
        });
      break;

    }

    
  }

  handleExpenseDelete = (expense) => {
    this.setState({ processing: true, showExpenseForm: false });
    const expenseRow = expense.id.substring(10);
    window.gapi.client.sheets.spreadsheets
      .batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: 0,
                  dimension: "ROWS",
                  startIndex: expenseRow - 1,
                  endIndex: expenseRow
                }
              }
            }
          ]
        }
      })
      .then(
        response => {
          this.snackbar.show({ message: "Expense deleted!" });
          this.load();
        },
        response => {
          console.error("Something went wrong");
          console.error(response);
          this.setState({ loading: false });
        }
      );
  }

  handleExpenseSelect = (data) => {

    switch (this.state.currentView) {
      case 'expense':
        this.setState({ expense: data, showExpenseForm: true });
      break;

      case 'loan':
        this.setState({ loan: data, showExpenseForm: true });
      break;

      case 'utility':
        this.setState({ utility: data, showExpenseForm: true });
      break;
    }
    
  }

  handleExpenseCancel = () => {
    this.setState({ showExpenseForm: false });
  }

  onExpenseNew() {
    const now = new Date();
    const today = `${now.getFullYear()}-${now.getMonth() < 9
      ? "0" + (now.getMonth() + 1)
      : now.getMonth() + 1}-${now.getDate() < 10
      ? "0" + now.getDate()
      : now.getDate()}`

    switch (this.state.currentView) {
      
      case 'expense':
        this.setState({
          showExpenseForm: true,
          expense: {
            amount: "",
            description: "",
            date: `${now.getFullYear()}-${now.getMonth() < 9
              ? "0" + (now.getMonth() + 1)
              : now.getMonth() + 1}-${now.getDate() < 10
              ? "0" + now.getDate()
              : now.getDate()}`,
            category: this.state.categories[0],
            account: this.state.accounts[0]
          }
        });
      break;

      case 'loan':
        this.setState({
          showExpenseForm: true,
          loan: {
            startDate: today,
            endDate: today,
            notes: "",
            category: this.state.loanCategories[0],
            loanAmount:"",
            interestRate:""
          }
        });
      break;

      case 'utility':
        this.setState({
          showExpenseForm: true,
          utility: {
            startDate: today,
            endDate: today,
            notes: "",
            category: this.state.utilityCategories[0],
            billAmount:"",
            unit:""
          }
        });
      break;
  }

  }

  parseExpense(value, index) {
    return {
      id: `Expenses!A${index + 2}`,
      date: value[0],
      description: value[1],
      category: value[3],
      amount: (value[4] || '').replace(/,/g, ""),
      account: value[2]
    };
  }

  parseLoan(value, index) {
    return {
      id: `Loans!A${index + 2}`,
      startDate: value[0],
      endDate: value[1],
      notes: value[2],
      category: value[3],
      loanAmount: (value[4] || '').replace(/,/g, ""),
      paid: value[5],
      loanTerm: value[6],
      interestRate: (value[7] || '').replace(/%/g, ""),
      paidPercentage: value[8],
      monthlyInstallment: value[9]
    };
  }

  parseUtility(value, index) {
    return {
      id: `Utility!A${index + 2}`,
      startDate: value[0],
      endDate: value[1],
      notes: value[2],
      category: value[3],
      billAmount:(value[4] || '').replace(/,/g, ""),
      unit:value[5],
    };
  }

  formatExpense(expense) {

    switch (this.state.currentView) {
      case 'expense':
        return [
          `=DATE(${expense.date.substr(0, 4)}, ${expense.date.substr(
            5,
            2
          )}, ${expense.date.substr(-2)})`,
          expense.description,
          expense.account,
          expense.category,
          expense.amount
        ];
      break;

      case 'loan':
        return [
          `=DATE(${expense.startDate.substr(0, 4)}, ${expense.startDate.substr(
            5,
            2
          )}, ${expense.startDate.substr(-2)})`,
          `=DATE(${expense.endDate.substr(0, 4)}, ${expense.endDate.substr(
            5,
            2
          )}, ${expense.endDate.substr(-2)})`,
          expense.notes,
          expense.category,
          expense.loanAmount,
          0,
          expense.loanTerm,
          expense.interestRate+'%',
        ];
      break;

      case 'utility':
        return [
          `=DATE(${expense.startDate.substr(0, 4)}, ${expense.startDate.substr(
            5,
            2
          )}, ${expense.startDate.substr(-2)})`, 
          `=DATE(${expense.endDate.substr(0, 4)}, ${expense.endDate.substr(
            5,
            2
          )}, ${expense.endDate.substr(-2)})`,
          expense.notes,
          expense.category,
          expense.billAmount,
          expense.unit
        ];
      break;
    }

   
  }

  append(expense) {
    return window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: [this.state.currentView == 'loan'?"Loan!A1":this.state.currentView == 'utility'?"Utility!A1":"Expenses!A1"],
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      values: [this.formatExpense(expense)]
    });
  }

  update(expense) {
    return window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: expense.id,
      valueInputOption: "USER_ENTERED",
      values: [this.formatExpense(expense)]
    });
  }
  //1:2
  load() {
    window.gapi.client.sheets.spreadsheets.values
      .batchGet({
        spreadsheetId: this.spreadsheetId,
        ranges: [
          "Data!A2:A50",
          "Data!E2:E50",
          "Expenses!A2:F",
          "Current!H1",
          "Previous!H1",   
          "Data!F2:F2",
          "Data!D2:D2",
          "Loans!A2:J",
          "Loans!K2:K2",
          "Loans!L2:L2",
          "Data!G2:G50",
          "Data!H2:H50",
          "Utility!A2:F",
          "Utility!G2:G2",
        ]
      })
      .then(response => {
        const accounts = response.result.valueRanges[0].values.map(
          items => items[0]
        );
        const categories = response.result.valueRanges[1].values.map(
          items => items[0]
        );
        const loanCategories = response.result.valueRanges[10].values.map(
          items => items[0]
        );
        const utilityCategories = response.result.valueRanges[11].values.map(
          items => items[0]
        );
        
        this.setState({
          accounts: accounts,
          categories: categories,
          loanCategories:loanCategories,
          utilityCategories:utilityCategories,
          expenses: (response.result.valueRanges[2].values || [])
            .map(this.parseExpense)
            .reverse()
            .slice(0, this.state.maxRecToShow),
          processing: false,
          currentMonth: response.result.valueRanges[3].values[0][0],
          previousMonth: response.result.valueRanges[4].values[0][0],
          pin:response.result.valueRanges[5].values[0][0],
          limitPerMonth:response.result.valueRanges[6].values[0][0],
          loans: (response.result.valueRanges[7].values || [])
          .map(this.parseLoan)
          .slice(0, this.state.maxRecToShow),
          totalLoan: response.result.valueRanges[8].values[0][0],
          totalEMI: response.result.valueRanges[9].values[0][0],
          utilitys: (response.result.valueRanges[12].values || [])
          .map(this.parseUtility)
          .slice(0, this.state.maxRecToShow),
          totalUtilityBill: response.result.valueRanges[13].values[0][0],
          filteredUtilityBills:(response.result.valueRanges[12].values || [])
          .map(this.parseUtility)
          .slice(0, this.state.maxRecToShow),
        });
      });
  }



  render() {
    return (
      <div>
        <header className="mdc-toolbar mdc-toolbar--fixed">
          <div className="mdc-toolbar__row">
            <section className="mdc-toolbar__section mdc-toolbar__section--align-start">
              <span className="mdc-toolbar__title">
              Daily Expenses
                {/* <select className="mdc-select header-drop-down">
                  <option>Daily Expenses</option>
                  <option>Loan</option>
                </select> */}
              </span>
            </section>
            <section
              className="mdc-toolbar__section mdc-toolbar__section--align-end"
              role="toolbar"
            >
              {this.state.signedIn === false &&
                <a
                  className="material-icons mdc-toolbar__icon"
                  aria-label="Sign in"
                  title="Sign in"
                  alt="Sign in"
                  onClick={e => {
                    e.preventDefault();
                    window.gapi.auth2.getAuthInstance().signIn();
                  }}
                >
                  perm_identity
                </a>}
              {this.state.signedIn &&
                <a
                  className="material-icons mdc-toolbar__icon"
                  aria-label="Sign out"
                  title="Sign out"
                  alt="Sign out"
                  onClick={e => {
                    e.preventDefault();
                    window.gapi.auth2.getAuthInstance().signOut();
                  }}
                >
                  exit_to_app
                </a>}
            </section>
          </div>
        </header>
        <div className="toolbar-adjusted-content">
          {this.state.signedIn === undefined && <LoadingBar />}
          {this.state.signedIn === false &&
            <div className="center">
              <button
                className="mdc-button sign-in"
                aria-label="Sign in"
                onClick={() => {
                  window.gapi.auth2.getAuthInstance().signIn();
                }}
              >
                Sign In
              </button>
            </div>}
            
            { this.state.signedIn && this.renderPin()}

          
        </div>
        <div
          ref={el => {
            if (el) {
              this.snackbar = new MDCSnackbar(el);
            }
          }}
          className="mdc-snackbar"
          aria-live="assertive"
          aria-atomic="true"
          aria-hidden="true"
        >
          <div className="mdc-snackbar__text" />
          <div className="mdc-snackbar__action-wrapper">
            <button
              type="button"
              className="mdc-button mdc-snackbar__action-button"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    );
  }

  renderPin() {
    if (this.state.signedIn && this.state.pinIsVfy) return this.renderBody();
    else if(this.state.pinIsVfy == false)
      return (
        <div className="content pin" >
           <input  type="password" placeholder="Enter PIN" name="userEnterPIN" maxLength="4" onChange={ this.handleChange } />
           <button onClick={() => this.verifyLogin(this.state.pin,this.state.userEnterPIN)} >Login</button>
        </div>
      );
  }

  verifyLogin(pin,enterPinValue){
    if(pin == enterPinValue){ 
      this.setState({
        pinIsVfy: true
      });
      sessionStorage.setItem('pinIsVfy',true);
    }
  }

  handleChange({ target }) {
    this.setState({
      [target.name]: target.value
    });

    if(target.value && target.value.length == 4){
      this.verifyLogin(this.state.pin,target.value);
    }
    
  }

  renderBody() {
    if (this.state.processing) return <LoadingBar />;
    else
      return (
        <div className="content">
          {this.renderExpenses()}
        </div>
      );
  }

  filterUtility(e){
    this.state.filteredUtilityBills = this.state.utilitys.filter(val=> (val.category==e.target.value));
  }

  renderExpenses() {
    if(this.state.showExpenseForm)
    switch (this.state.currentView){

      case 'expense':
      return (
        <ExpenseForm
          categories={this.state.categories}
          accounts={this.state.accounts}
          expense={this.state.expense}
          totalRec={this.state.expenses.length}
          onSubmit={this.handleExpenseSubmit}
          onCancel={this.handleExpenseCancel}
          onDelete={this.handleExpenseDelete}
          onChange={this.handleExpenseChange}
        />
      );
      break;

      case 'loan':
      return (
        <LoanForm
          loanCategories={this.state.loanCategories}
          loan={this.state.loan}
          totalRec={this.state.loans.length}
          onSubmit={this.handleExpenseSubmit}
          onCancel={this.handleExpenseCancel}
          onDelete={this.handleExpenseDelete}
          onChange={this.handleExpenseChange}
        />
      );
      break;

      case 'utility':
      return (
        <UtilityForm
          utilityCategories={this.state.utilityCategories}
          utility={this.state.utility}
          totalRec={this.state.utilitys.length}
          onSubmit={this.handleExpenseSubmit}
          onCancel={this.handleExpenseCancel}
          onDelete={this.handleExpenseDelete}
          onChange={this.handleExpenseChange}
        />
      );
      break;

    }
    else
      return (
        <div>
          <nav className="nav-bar">
            <button className="mdc-button" onClick={() =>this.setState({currentView : 'expense'})}>Daily Expenses</button>
            <button className="mdc-button" style={{backgroundColor: this.state.currentView == 'loan' ? 'red':'#2ed6a8'} } onClick={() =>this.setState({currentView : 'loan'})}>Loan Details</button>
            <button className="mdc-button" style={{backgroundColor: this.state.currentView == 'utility'? '#d97423':'#2ed6a8'} } onClick={() =>this.setState({currentView : 'utility'})}>Utility Bills</button>
            <button className="mdc-button" style={{backgroundColor: this.state.currentView == 'note' ? 'green':'#2ed6a8'} } onClick={() =>this.setState({currentView : 'note'})}>Notes</button>
          </nav>

          <div className="mdc-card" >
            <section className="mdc-card__primary">
              <h2 className="mdc-card__subtitle">{this.state.currentView == 'loan'?'Total Pending Loan':"This month you've spent:" }</h2>
              <h1 className="mdc-card__title mdc-card__title--large center">
                {this.state.currentView == 'loan'?this.state.totalLoan:this.state.currentView == 'utility'? this.state.totalUtilityBill:this.state.currentMonth}
              </h1>
            </section>
            <section className="mdc-card__supporting-text">
              <ul>
                <li>{this.state.currentView == 'loan'? 'Total Monthly EMI':'Previous month'}: <b>{this.state.currentView == 'loan'? this.state.totalEMI:this.state.previousMonth}</b></li>
                <li>{this.state.currentView == 'loan'? 'Number Of Loan':'Monthly spending limit Remaining'}: <b>{this.state.currentView == 'loan'?this.state.loans.length:this.state.currentMonth.slice(0,1)+(parseFloat(this.state.limitPerMonth) - parseFloat(this.state.currentMonth.replace(/,/g,'').slice(1)))}</b></li>
              </ul>

              {this.state.currentView != 'utility'?'':
              <div className="mdc-form-field">
                <select className="mdc-select" onChange={this.filterUtility}>
                <option></option>
                  {
                    this.state.utilityCategories.map(element => {
                      return ( <option>{element}</option>)   
                    })
                  }
                </select>   
              </div>
            }
            </section>
            
           
          </div>

          <ExpenseList
            expenses={this.state.currentView == 'loan'?this.state.loans:this.state.currentView == 'utility'?this.state.filteredUtilityBills:this.state.expenses}
            onSelect={this.handleExpenseSelect}
          />
          {(this.state.expenses.length >= this.state.maxRecToShow) &&
              <div className="show-all"><button className="mdc-button" onClick={() => this.state.maxRecToShow=this.state.maxRecToShow+this.state.maxRecToShow}>show all</button></div>
          }
          <button
            onClick={() => this.onExpenseNew()}
            className="mdc-fab app-fab--absolute material-icons"
            aria-label="Add expense"
          >
            <span className="mdc-fab__icon ">add</span>
          </button>
        </div>
      );
  }
}

export default App;
